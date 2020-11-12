import xpath from 'xpath';
import { DOMParser, XMLSerializer } from 'xmldom';
import { Passage, ActivityStates, MediaFile, Section } from '../model';
import Memory from '@orbit/memory';
import { QueryBuilder, TransformBuilder, Record, Operation } from '@orbit/data';
import { related, getMediaRec, parseRef, UpdatePassageStateOps } from '../crud';
import { getParatextProgPath } from './paratextPath';

const isElectron = process.env.REACT_APP_MODE === 'electron';
var temp = isElectron ? require('electron').remote.getGlobal('temp') : '';
const execa = isElectron ? require('execa') : null;
const path = require('path');
const fs = isElectron ? require('fs-extra') : null;

const domParser = new DOMParser();
const xmlSerializer = new XMLSerializer();
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

const isText = (v: Node | null) => v?.nodeType === Node.TEXT_NODE;

const isPara = (v: Node | null) =>
  v?.nodeType === Node.ELEMENT_NODE && v?.nodeName === 'para';

const isSection = (v: Node) =>
  isPara(v) && (v as Element)?.getAttribute('style') === 's';

const isNote = (v: Node) =>
  v.nodeType === Node.ELEMENT_NODE && v.nodeName === 'note';

const isAfterSection = (v: Node) => {
  var prevSib;
  if (isPara(v)) prevSib = v.previousSibling;
  else prevSib = v.parentNode?.previousSibling;
  if (prevSib === null) return undefined;
  if (isText(prevSib as Node) && isSection(prevSib?.previousSibling as Element))
    return prevSib?.previousSibling as Element;
};

const isVerse = (v: Node | null) => {
  if (v == null || v.nodeType !== Node.ELEMENT_NODE) return false;
  return (v as Element).nodeName === 'verse';
};

const firstVerse = (para: Node) => {
  var verse = para.firstChild;
  while (verse && !isVerse(verse)) verse = verse?.nextSibling;
  return verse;
};

const verseText = (v: Element) => {
  var next: Node | undefined | null = v.nextSibling;
  var text = '';
  while (next) {
    if (isText(next)) {
      text += next.nodeValue;
      if (next.nextSibling) next = next.nextSibling;
      else next = next.parentNode?.nextSibling;
    } else if (isPara(next)) {
      if (isSection(next) || firstVerse(next)) next = null;
      else if (next.firstChild && isText(next.firstChild))
        next = next.firstChild;
      else next = next.nextSibling;
    } else if (isVerse(next)) next = null;
    //note
    else if (next.nextSibling) next = next.nextSibling;
    else next = next.parentNode?.nextSibling;
  }
  return text;
};
const newEl = (doc: Document, tag: string, style: string, vNum?: string) => {
  const el = doc.createElement(tag);
  if (vNum) el.setAttribute('number', vNum);
  el.setAttribute('style', style);
  return el;
};

function bruteForceVerses(node: Node | null, verses: Element[]) {
  for (var n = node; n !== null; n = n.nextSibling) {
    if (isVerse(n)) {
      verses.push(n as Element);
    }
    bruteForceVerses(n.firstChild, verses);
  }
}

const getVerses = (node: Node) => {
  try {
    if (isPara(node)) {
      var verses: Element[] = [];
      for (
        var n: Node | null = node.firstChild;
        n !== null;
        n = n.nextSibling
      ) {
        if (isVerse(n)) {
          verses.push(n as Element);
        }
      }
      return verses;
    } else return xpath.select('//verse', node) as Element[];
  } catch {
    //var sDebug = xmlSerializer.serializeToString(node);
    verses = [];
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

const getVerse = (doc: Document, verses: string) => {
  var v = getElementsWithAttribute(doc, 'verse', 'number', verses);
  if (v.length > 0) return v[0];
};

const addSection = (
  doc: Document,
  passage: Passage,
  verse: Element,
  memory: Memory,
  addNumbers = true
) => {
  var sections = memory.cache.query((q: QueryBuilder) =>
    q.findRecords('section')
  ) as Section[];
  /* get the section for this passage to get the plan */
  const sectionId = related(passage, 'section');
  const sectionRec = sections.filter((s) => s.id === sectionId)[0];
  var para = moveToPara(doc, verse);
  doc.insertBefore(
    paratextSection(
      doc,
      (addNumbers ? sectionRec.attributes.sequencenum.toString() + ' - ' : '') +
        sectionRec.attributes.name
    ),
    para
  );
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
    : doc.documentElement.appendChild(next);

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

const ReplaceText = (doc: Document, para: Element, transcript: string) => {
  //remove text
  var verse = firstVerse(para);
  var next = verse?.nextSibling;
  var rem = next;

  while (next) {
    rem = next;
    if (isText(next)) {
      if (next.nextSibling) next = next.nextSibling;
      else next = next.parentNode?.nextSibling;
      var removeParent =
        rem.parentNode?.childNodes.length === 1 ? rem.parentNode : null;
      rem.parentNode?.removeChild(rem);
      if (removeParent) removeParent.parentNode?.removeChild(removeParent);
    } else if (isPara(next)) {
      if (isSection(next) || firstVerse(next)) next = null;
      else if (next.firstChild && isText(next.firstChild))
        next = next.firstChild;
      else next = next.nextSibling;
    } else if (isVerse(next)) next = null;
    //note
    else if (next.nextSibling) next = next.nextSibling;
    else next = next.parentNode?.nextSibling;
  }
  var lines: string[] = removeTimestamps(transcript).split('\n');
  addAfter(doc, verse, doc.createTextNode(lines[0]));
  var last = para;
  for (var ix = 1; ix < lines.length; ix++) {
    addAfter(doc, last, paratextPara(doc, 'p', doc.createTextNode(lines[ix])));
    last = last?.nextSibling as HTMLElement;
  }
};
const moveToPara = (doc: Document, verse: Element) => {
  if (isPara(verse)) return verse;
  if (isPara(verse.parentNode)) {
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

const findNodeAfterVerse = (
  doc: Document,
  verses: Element[],
  startVerse: number,
  endVerse: number
) => {
  let after: Element | undefined = undefined;
  let nextverse: number = 9999;
  /* these may not be ordered */
  verses.forEach((v) => {
    const [vstart, vend] = domVnum(v);
    if (
      (startVerse === vstart && vend > endVerse) ||
      (vstart > startVerse && vstart < nextverse)
    ) {
      after = v;
      nextverse = vstart;
    }
    if (after) nextverse = vstart;
  });
  if (after) {
    after = moveToPara(doc, after);
    //skip section if there
    if (isAfterSection(after)) {
      return isAfterSection(after);
    }
  }
  return after;
};

const postPass = (doc: Document, p: Passage, memory: Memory) => {
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
  var thisVerse = removeOverlappingVerses(doc, p);
  if (thisVerse) {
    thisVerse = moveToPara(doc, thisVerse);
    ReplaceText(doc, thisVerse, sortedMedia[0].attributes.transcription || '');
  } else {
    let verses = getVerses(doc.documentElement);
    var nextVerse = findNodeAfterVerse(doc, verses, p.startVerse, p.endVerse);
    thisVerse = addParatextVerse(
      doc,
      nextVerse,
      passageVerses(p),
      sortedMedia[0].attributes.transcription || '',
      true
    );
  }
  if (p.attributes.sequencenum === 1) {
    addSection(doc, p, thisVerse, memory, true);
  }
};

/*
  const passageChapter = (p: Passage) => {
  var nums = /[0-9]+/.exec(p.attributes.reference);
  if (nums && nums.length > 0) return nums[0];
  return null;
};
*/

const removeSection = (v: Element) => v.parentNode?.removeChild(v);

const removeVerse = (v: Element) => {
  if (!isVerse(v)) return;

  var removeParent =
    v.parentNode !== null &&
    isPara(v.parentNode) &&
    getVerses(v.parentNode).length === 1
      ? v.parentNode
      : null;

  var next = v.nextSibling;
  var rem = next;
  while (next != null) {
    if (isText(next)) {
      next = next.nextSibling;
      if (rem) v.parentNode?.removeChild(rem);
    } else if (isPara(next) && !isSection(next) && !isVerse(next.firstChild)) {
      next = next.nextSibling;
      (rem as Element).remove();
    } else if (isNote(next)) next = next.nextSibling;
    //don't remove the note
    else next = null;
    rem = next;
  }
  v.parentNode?.removeChild(v);
  if (removeParent != null) removeParent.parentNode?.removeChild(removeParent);
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
      if (vstart === first && vend === last) {
        if (p.attributes.sequencenum === 1 && isAfterSection(v))
          existing.push(isAfterSection(v) as Element);
      } else {
        if (vstart <= p.startVerse) result = vend >= p.startVerse;
        else result = vstart <= p.endVerse;
        if (result && verseText(v).trim() === '') {
          existing.push(v);
        }
      }
    }
  });
  existing.forEach((v) => {
    if (isVerse(v)) removeVerse(v);
    else removeSection(v);
  });
  return getVerse(doc, passageVerses(p));
};

const doChapter = async (
  plan: string,
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

  pass = pass.sort((i, j) => (i.startVerse < j.startVerse ? -1 : 1));
  pass.forEach((p) => {
    postPass(usxDom, p, memory);
  });

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
      related(p, 'section'),
      plan,
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
  plan: string,
  ptProjName: string,
  passages: Passage[],
  memory: Memory,
  userid: number,
  addNumberToSection: boolean = true
) => {
  let chapChg: { [key: string]: Passage[] } = {};
  passages
    .filter((p) => p.attributes.state === ActivityStates.Approved)
    .filter((p) => related(getMediaRec(p.id, memory), 'plan') === plan)
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
        plan,
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
