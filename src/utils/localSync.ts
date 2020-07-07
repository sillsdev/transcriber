import { Passage, ActivityStates, MediaFile, Section } from '../model';
import Memory from '@orbit/memory';
import { getMediaProjRec, getMediaRec, parseRef } from '.';
import { DOMParser, XMLSerializer } from 'xmldom';
import xpath from 'xpath';
import { QueryBuilder, TransformBuilder, Record, Operation } from '@orbit/data';
import related from './related';
import { getParatextProgPath } from './paratextPath';
import { UpdatePassageStateOps } from './UpdatePassageState';

const isElectron = process.env.REACT_APP_MODE === 'electron';
var temp = isElectron ? require('electron').remote.getGlobal('temp') : '';
const execa = isElectron ? require('execa') : null;
const path = require('path');
const fs = isElectron ? require('fs-extra') : null;

const domParser = new DOMParser();
const xmlSerializer = new XMLSerializer();
const refRe = /^[0-9+][^0-9]+([0-9]+)[^0-9]?([0-9]+)?$/;
const vrefRe = /^([0-9]+)[^0-9]?([0-9]+)?$/;

const vInt = (s: string) => (typeof s === 'string' ? parseInt(s) : s);

const passageVerses = (p: Passage) =>
  p.startVerse.toString() +
  (p.endVerse > p.startVerse ? '-' + p.endVerse.toString() : '');

const domVnum = (v: Element) => {
  const vrefAttr = v.getAttribute('number');
  const vrefMatch = vrefAttr ? vrefRe.exec(vrefAttr) : null;
  if (vrefMatch) {
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    const [_, vstart, vend] = vrefMatch;
    return [vInt(vstart), vInt(vend) || vInt(vstart)];
  }
  return [];
};

const newEl = (doc: Document, tag: string, style: string, vNum?: string) => {
  const el = doc.createElement(tag);
  if (vNum) el.setAttribute('number', vNum);
  el.setAttribute('style', style);
  return el;
};

const rmNodeTx = (doc: Document, node: Node) => {
  while (node.firstChild) {
    node.removeChild(node.firstChild);
  }
  doc.removeChild(node);
};

function bruteForceVerses(node: Node | null, verses: Element[]) {
  for (var n = node; n !== null; n = n.nextSibling) {
    if (n.nodeType === Node.ELEMENT_NODE && n.nodeName === 'verse') {
      verses.push(n as Element);
    }
    bruteForceVerses(n.firstChild, verses);
  }
}

const getVerses = (node: Node) => {
  try {
    return xpath.select('//verse', node) as Element[];
  } catch {
    var sDebug = xmlSerializer.serializeToString(node);
    console.log('bruteforce', sDebug);
    var verses: Element[] = [];
    bruteForceVerses(node, verses);
    return verses;
  }
};

const getElementsWithAttribute = (
  node: Node,
  name: string,
  attributename: string,
  attributeValue: string
) => {
  return xpath.select(
    '//' + name + '[@' + attributename + '="' + attributeValue + '"]',
    node
  ) as Element[];
};
const paratextPara = (
  doc: Document,
  style: string,
  child: Node | null = null,
  tmpAttribute: string = '',
  tmpValue: string = ''
) => {
  var pEl = newEl(doc, 'para', style);
  pEl.appendChild(doc.createTextNode('\r\n'));
  if (child) pEl.appendChild(child);
  if (tmpAttribute !== '') pEl.setAttribute(tmpAttribute, tmpValue);

  return pEl;
};

const paratextSection = (doc: Document, text: string) => {
  return paratextPara(doc, 's', doc.createTextNode(text));
};

const paratextVerse = (doc: Document, verses: string, transcript: string) => {
  var para = paratextPara(doc, 'p', newEl(doc, 'verse', 'v', verses));
  if (transcript && transcript !== '')
    para.appendChild(doc.createTextNode(transcript));
  return para;
};

const removeSections = (doc: Document) => {
  let sections = getElementsWithAttribute(doc, 'para', 'style', 's');
  sections.forEach((s) => rmNodeTx(doc, s));
};

const getVerse = (doc: Document, verses: string) => {
  var v = getElementsWithAttribute(doc, 'verse', 'number', verses);
  if (v.length > 0) return v[0];
};

const addSections = (
  doc: Document,
  passage: Passage,
  book: string,
  chap: string,
  memory: Memory,
  addNumbers = true
) => {
  var sections = memory.cache.query((q: QueryBuilder) =>
    q.findRecords('section')
  ) as Section[];
  var passages = memory.cache.query((q: QueryBuilder) =>
    q.findRecords('passage')
  ) as Passage[];
  /* get the section for this passage to get the plan */
  const sectionId = related(passage, 'section');
  const sectionRecs = sections.filter((s) => s.id === sectionId);
  var planid = related(sectionRecs[0], 'plan');
  /* get all the sections in this plan */
  sections = sections.filter((s) => related(s, 'plan') === planid) as Section[];
  /* gather the sections in this chapter */
  var inChapter: {
    section: Section;
    verses: string;
    startverse: number;
  }[] = [];
  sections.forEach((s) => {
    var p1 = passages.filter(
      (p) =>
        related(p, 'section') === s.id &&
        p.attributes.sequencenum === 1 &&
        p.attributes.book === book &&
        passageChapter(p) === chap
    );
    if (p1.length > 0) {
      parseRef(p1[0]);
      inChapter.push({
        section: s,
        verses: passageVerses(p1[0]),
        startverse: p1[0].startVerse, //in case verses aren't in paratext yet
      });
    }
  });
  inChapter.forEach((s) => {
    var verse = getVerse(doc, s.verses);
    if (!verse) {
      verse = findNodeAfterVerse(
        getVerses(doc.documentElement),
        s.startverse - 1
      );
    }
    if (verse) {
      var para = moveToPara(doc, verse);
      doc.insertBefore(
        paratextSection(
          doc,
          (addNumbers
            ? s.section.attributes.sequencenum.toString() + ' - '
            : '') + s.section.attributes.name
        ),
        para
      );
    }
  });
};

const removeTimestamps = (transcript: string | null) =>
  transcript
    ? transcript.replace(/\([0-9]{1,2}:[0-9]{2}(:[0-9]{2})?\)/g, '')
    : '';

const addAfter = (doc: Document, last: Node | null | undefined, next: Node) =>
  last?.nextSibling
    ? doc.insertBefore(next, last.nextSibling)
    : last?.parentNode
    ? last?.parentNode.appendChild(next)
    : doc.appendChild(next);

const addParatextVerse = (
  doc: Document,
  sibling: Node | null | undefined,
  verses: string,
  transcript: string,
  before: boolean = false
) => {
  var lines: string[] = removeTimestamps(transcript).split('\n');
  var first = paratextVerse(doc, verses, lines[0]);
  if (before && sibling) doc.insertBefore(first, sibling);
  else addAfter(doc, sibling, first);

  var last = first;
  for (var ix = 1; ix < lines.length; ix++) {
    addAfter(doc, last, paratextPara(doc, 'p', doc.createTextNode(lines[ix])));
    last = last?.nextSibling as HTMLElement;
  }
  return first;
};

const moveToPara = (doc: Document, verse: Element) => {
  if (verse.parentNode?.nodeName === 'para') {
    //we're expecting one previous sibling with the newline
    if (verse.previousSibling != null) {
      if (
        verse.previousSibling.previousSibling != null ||
        verse.previousSibling.nodeType !== doc.TEXT_NODE ||
        verse.previousSibling.nodeValue?.replace(/\s+/g, '') !== ''
      ) {
        /* move this and everything after it to a new para */
        var prevPara = verse.parentNode;
        var nextSib = verse.nextSibling;
        var newPara = paratextPara(doc, 'p');
        addAfter(doc, prevPara, newPara);
        newPara.appendChild(verse);
        while (nextSib !== null) {
          var next = nextSib.nextSibling;
          newPara.appendChild(nextSib);
          nextSib = next;
        }
        return newPara as Element;
      }
    }
    return verse.parentNode as Element;
  } else {
    var para = doc.insertBefore(paratextPara(doc, 'p'), verse);
    para.appendChild(verse);
    return para;
  }
};

const findNodeAfterVerse = (verses: Element[], verse: number) => {
  let after: Element | undefined;
  let vaft: number = 9999;
  /* these may not be ordered */
  verses.forEach((v) => {
    const [vstart] = domVnum(v);
    if (vstart > verse && vstart < vaft) {
      vaft = vstart;
      after = v;
    }
  });
  return after;
};

const postPass = (doc: Document, p: Passage, memory: Memory) => {
  const refMatch = refRe.exec(p.attributes.reference);
  if (!refMatch) return;
  //get transcription
  const media = related(p, 'mediafiles') as Record[];
  const sortedMedia = media
    .map(
      (m) =>
        memory.cache.query((q: QueryBuilder) => q.findRecord(m)) as MediaFile
    )
    .sort((i, j) =>
      i.attributes.versionNumber > j.attributes.versionNumber ? -1 : 1
    );
  //remove existing verses
  var [firstRemoved, lastRemoved] = removeOverlappingVerses(doc, p);

  let verses = getVerses(doc.documentElement);
  var nextVerse = findNodeAfterVerse(verses, p.endVerse);
  if (nextVerse) nextVerse = moveToPara(doc, nextVerse);

  //add a node for each verse before our passage starts
  for (var ix = firstRemoved; ix < p.startVerse; ix++) {
    addParatextVerse(doc, nextVerse, ix.toString(), '', true);
  }
  addParatextVerse(
    doc,
    nextVerse,
    passageVerses(p),
    sortedMedia[0].attributes.transcription || '',
    true
  );
  //add a node for each verse after our passage ends
  for (ix = p.endVerse + 1; ix <= lastRemoved; ix++) {
    addParatextVerse(doc, nextVerse, ix.toString(), '', true);
  }
};

const passageChapter = (p: Passage) => {
  var nums = /[0-9]+/.exec(p.attributes.reference);
  if (nums && nums.length > 0) return nums[0];
  return null;
};

const removeOverlappingVerses = (doc: Document, p: Passage) => {
  var verses = getVerses(doc.documentElement);
  const existing = Array<Element>();
  var first = p.startVerse;
  var last = p.endVerse;
  verses.forEach((v) => {
    var [vstart, vend] = domVnum(v);
    var result = false;
    if (vstart) {
      if (vstart <= p.startVerse) result = vend >= p.startVerse;
      //vstart > start
      else result = vstart <= p.endVerse;
      if (result) existing.push(v);
    }
  });
  var startRemove: ChildNode | null = null;
  if (existing.length > 0) {
    var [lstart] = domVnum(existing[0] as Element);
    first = lstart;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    var [_lstart, lend] = domVnum(existing[existing.length - 1]);
    last = lend;
    var thisVerse = moveToPara(doc, existing[0]);
    startRemove = thisVerse;
  }
  var nextVerse = findNodeAfterVerse(verses, last);
  if (nextVerse) nextVerse = moveToPara(doc, nextVerse);
  //remove everything from first existing verse until nextverse
  while (startRemove && startRemove !== nextVerse) {
    var remove = startRemove;
    startRemove = startRemove.nextSibling;
    rmNodeTx(doc, remove);
  }
  return [first, last];
};

const doChapter = async (
  chap: string,
  pass: Passage[],
  ptProjName: string,
  memory: Memory,
  userid: number,
  addNumberToSection: boolean
) => {
  if (!temp) throw new Error('Unable to find temp directory.'); //this is app.getPath('temp')
  const tempName = path.join(temp, chap + '.usx');
  const pt = chap.split('-');
  const ptProg = await getParatextProgPath();
  const progName = path.join(ptProg, 'rdwrtp8');
  const { stdout } = await execa(progName, [
    '-r',
    ptProjName,
    pt[0],
    pt[1],
    tempName,
    '-x',
  ]);
  if (stdout) console.log(stdout);
  const usx: string = fs.readFileSync(tempName, 'utf-8');
  let usxDom: Document = domParser.parseFromString(usx);

  removeSections(usxDom);
  pass = pass.sort((i, j) => (i.startVerse < j.startVerse ? -1 : 1));
  pass.forEach((p) => {
    postPass(usxDom, p, memory);
  });
  addSections(usxDom, pass[0], pt[0], pt[1], memory, addNumberToSection);

  const usxXml: string = xmlSerializer.serializeToString(usxDom);
  fs.writeFileSync(tempName, usxXml, { encoding: 'utf-8' });
  const { stdoutw } = await execa(progName, [
    '-w',
    ptProjName,
    pt[0],
    pt[1],
    tempName,
    '-x',
  ]);
  if (stdoutw) console.log(stdoutw);
  var ops: Operation[] = [];
  var tb = new TransformBuilder();

  for (let p of pass) {
    UpdatePassageStateOps(
      p.id,
      ActivityStates.Done,
      'Paratext',
      userid,
      tb,
      ops,
      memory
    );
  }
  await memory.update(ops);
  fs.unlinkSync(tempName);
};

export const localSync = async (
  project: string,
  ptProjName: string,
  passages: Passage[],
  memory: Memory,
  userid: number,
  addNumberToSection: boolean = true
) => {
  let chapChg: { [key: string]: Passage[] } = {};
  passages
    .filter((p) => p.attributes.state === ActivityStates.Approved)
    .filter((p) => {
      const projRec = getMediaProjRec(getMediaRec(p.id, memory), memory);
      return projRec && projRec.id === project;
    })
    .forEach((p) => {
      parseRef(p);
      let chap = p.startChapter;
      if (chap) {
        const k = p.attributes.book + '-' + chap;
        if (chapChg.hasOwnProperty(k)) {
          chapChg[k].push(p);
        } else {
          chapChg[k] = [p];
        }
      }
    });
  for (let c of Object.keys(chapChg)) {
    try {
      await doChapter(
        c,
        chapChg[c],
        ptProjName,
        memory,
        userid,
        addNumberToSection
      );
    } catch (error) {
      return error.stdout;
    }
  }
  return '';
};
export default localSync;
