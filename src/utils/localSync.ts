import xpath from 'xpath';
import { DOMParser, XMLSerializer } from 'xmldom';
import { Passage, ActivityStates, MediaFile, Section } from '../model';
import Memory from '@orbit/memory';
import { Operation, QueryBuilder, TransformBuilder } from '@orbit/data';
import { related, parseRef, UpdateMediaStateOps } from '../crud';
import { getReadWriteProg } from './paratextPath';

interface PassageInfo {
  passage: Passage;
  mediaId: string;
  transcription: string;
}
const isElectron = process.env.REACT_APP_MODE === 'electron';
const ipc = isElectron ? require('electron').ipcRenderer : null;
const path = require('path');
const fs = isElectron ? require('fs-extra') : null;

const domParser = new DOMParser();
const xmlSerializer = new XMLSerializer();
const vrefRe = /^([0-9]+)[^0-9]?([0-9]+)?$/;

const vInt = (s: string) => (typeof s === 'string' ? parseInt(s) : s);

const passageVerses = (p: Passage) =>
  (p?.startVerse || 0).toString() +
  ((p?.endVerse || 0) > (p?.startVerse || 0)
    ? '-' + (p?.endVerse || 0).toString()
    : '');

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

const isEmptyPara = (v: Node | null) =>
  v !== null &&
  isPara(v) &&
  (v?.firstChild === null ||
    (isText(v.firstChild) &&
      (v?.firstChild.nodeValue as string).trimEnd() === ''));

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
  return verse as Element;
};

const verseText = (v: Element) => {
  var next: Node | undefined | null =
    v.firstChild || v.nextSibling || v.parentNode?.nextSibling;
  var text = '';
  while (next) {
    if (isSection(next) || isVerse(next)) next = null;
    else if (isText(next)) {
      text += next.nodeValue;
    }
    if (next)
      next =
        next.firstChild || next.nextSibling || next.parentNode?.nextSibling;
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
/*
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
*/
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
/*
const getVerse = (doc: Document, verses: string) => {
  var v = getElementsWithAttribute(doc, 'verse', 'number', verses);
  if (v.length > 0) return v[0];
};
*/
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
const RemoveText = (v: Element) => {
  if (!isVerse(v)) return;
  var next = v.firstChild || v.nextSibling || v.parentNode?.nextSibling;
  var rem;
  var remParent;
  while (next != null) {
    rem = null;
    if (isSection(next) || isVerse(next)) next = null;
    else if (!isNote(next) && !next.firstChild)
      //don't remove the note or anything with children (yet)
      rem = next;
    if (next) {
      remParent =
        rem && rem.parentNode?.childNodes.length === 1 ? rem.parentNode : null;
      next = next =
        next.firstChild || next.nextSibling || next.parentNode?.nextSibling;
    }
    if (rem) rem.parentNode?.removeChild(rem);
    if (remParent) remParent.parentNode?.removeChild(remParent);
  }
};
const ReplaceText = (doc: Document, para: Element, transcript: string) => {
  //remove text
  var verse = firstVerse(para);
  RemoveText(verse);
  var lines: string[] = removeTimestamps(transcript).split('\n');
  var last = addAfter(doc, verse, doc.createTextNode(lines[0]));
  //var last = para;
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
    var style = after.getAttribute('style');
    if (style && style.startsWith('q')) {
      var level = parseInt(style.substring(1)) || 0;
      while (level > 1) {
        if (
          after.parentNode &&
          (after.parentNode as Element).getAttribute('style') &&
          (after.parentNode as Element).getAttribute('style')?.startsWith('q')
        )
          //we don't want to put our stuff in between q levels
          //find the q1 - I'd expect it to be my parent...but it's a previous sibling...
          after = after.parentNode as Element;
        else after = after.previousSibling as Element;
        while (
          !(after.getAttribute('style') || '').startsWith('q') &&
          after.previousSibling
        )
          after = after.previousSibling as Element;

        style = after.getAttribute('style');
        if (style && style.startsWith('q'))
          level = parseInt(style.substring(1));
        //give up
        else level = 0;
      }
    }
    //skip section if there
    if (isAfterSection(after)) {
      return isAfterSection(after);
    }
  }
  return after;
};

const ParseTranscription = (currentPassage: Passage, transcription: string) => {
  var pattern = /(\\v\s*[0-9+]-*[0-9+]*)/g;
  var internalverses = Array.from(transcription.matchAll(pattern));
  // Get all matches
  if (internalverses.length < 1) {
    currentPassage.attributes.lastComment = transcription.trimEnd();
    return [currentPassage];
  }
  var ret: Passage[] = [];
  var start = 0;
  internalverses.forEach((match, index) => {
    start = match.index! + match[0].length;
    var t =
      index < internalverses.length - 1
        ? transcription.substring(start, internalverses![index + 1].index!)
        : transcription.substring(start);
    ret.push({
      attributes: {
        book: currentPassage.attributes.book,
        reference:
          (currentPassage.startChapter || 0).toString() +
          ':' +
          match[0].replace('\\v', '').trimStart(),
        lastComment: t.trimStart().trimEnd(),
      },
      relationships: currentPassage.relationships,
    } as Passage);
  });
  ret[0].attributes.sequencenum = currentPassage.attributes.sequencenum;
  ret.forEach((p) => parseRef(p));
  return ret;
};
const postPass = (doc: Document, currentPI: PassageInfo, memory: Memory) => {
  //get transcription
  var transcription = currentPI.transcription;
  var parsed = ParseTranscription(currentPI.passage, transcription);
  if (parsed.length > 1) {
    //remove original range if it exists and we're replacing with multiple
    var existing = getExistingVerses(doc, currentPI.passage);
    if (existing.exactVerse) removeVerse(existing.exactVerse);
    existing.allVerses.forEach((v) => {
      if (isSection(v)) removeSection(v);
    });
  }
  parsed.forEach((p) => {
    //remove existing verses
    var thisVerse = removeOverlappingVerses(doc, p);

    if (thisVerse) {
      thisVerse = moveToPara(doc, thisVerse);
      ReplaceText(doc, thisVerse, p.attributes.lastComment);
    } else {
      let verses = getVerses(doc.documentElement);
      var nextVerse = findNodeAfterVerse(
        doc,
        verses,
        p?.startVerse || 0,
        p?.endVerse || 0
      );
      thisVerse = addParatextVerse(
        doc,
        nextVerse,
        passageVerses(p),
        p.attributes.lastComment,
        true
      );
    }
    if (p.attributes.sequencenum === 1) {
      addSection(doc, p, thisVerse, memory, true);
    }
  });
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
    isEmptyPara(v.parentNode) &&
    getVerses(v.parentNode).length === 1
      ? v.parentNode
      : null;
  RemoveText(v);
  v.parentNode?.removeChild(v);
  if (removeParent != null) removeParent.parentNode?.removeChild(removeParent);
};

const getExistingVerses = (
  doc: Document,
  p: Passage,
  includeExact: boolean = false
) => {
  var verses = getVerses(doc.documentElement);
  const allVerses = Array<Element>();
  var first = p?.startVerse || 0;
  var last = p?.endVerse || 0;
  var exactVerse: Element | undefined;
  verses.forEach((v) => {
    var [vstart, vend] = domVnum(v);
    if (vstart) {
      if (vstart === first && vend === last) {
        exactVerse = v;
        if (!includeExact) {
          vstart = 0;
          if (p.attributes.sequencenum === 1 && isAfterSection(v))
            allVerses.push(isAfterSection(v) as Element);
        }
      }
      if (vstart >= first && vend <= last && !allVerses.includes(v)) {
        allVerses.push(v);
        if (p.attributes.sequencenum === 1 && isAfterSection(v))
          allVerses.push(isAfterSection(v) as Element);
      }
    }
  });
  return { allVerses, exactVerse };
};
const removeOverlappingVerses = (doc: Document, p: Passage) => {
  const existing = getExistingVerses(doc, p);
  existing.allVerses.forEach((v) => {
    if (isVerse(v)) removeVerse(v);
    else removeSection(v);
  });
  return existing.exactVerse;
};
const getPassageVerses = (doc: Document, p: Passage) => {
  const existing = getExistingVerses(doc, p, true);
  if (existing.allVerses.length === 0) throw new Error('no range');
  var transcription = '';
  existing.allVerses.forEach((v) => {
    if (isVerse(v))
      transcription +=
        '\\v ' +
        v.getAttribute('number') +
        ' ' +
        verseText(v).replace('\\p', '\r');
  });
  return transcription;
};

const paratextPaths = async (chap: string) => {
  const ptProg = await getReadWriteProg();
  const pt = chap.split('-');
  const temp = await ipc?.invoke('temp');
  return {
    chapterFile: path.join(temp, chap + '.usx'),
    book: pt[0],
    chapter: pt[1],
    program: ptProg,
  };
};

const getChapter = async (
  paths: {
    chapterFile: string;
    book: string;
    chapter: string;
    program: (args: string[]) => Promise<any>;
  },
  ptProjName: string
) => {
  const temp = await ipc?.invoke('temp');
  if (!temp) throw new Error('Unable to find temp directory.'); //this is app.getPath('temp')
  const { stdout } = await paths.program([
    '-r',
    ptProjName,
    paths.book,
    paths.chapter,
    paths.chapterFile,
    '-x',
  ]);
  if (stdout) console.log(stdout);

  const usx: string = fs.readFileSync(paths.chapterFile, 'utf-8');
  return domParser.parseFromString(usx);
};

const writeChapter = async (
  paths: {
    chapterFile: string;
    book: string;
    chapter: string;
    program: (args: string[]) => Promise<any>;
  },
  ptProjName: string,
  usxDom: Document
) => {
  const usxXml: string = xmlSerializer.serializeToString(usxDom);
  fs.writeFileSync(paths.chapterFile, usxXml, { encoding: 'utf-8' });
  return await paths.program([
    '-w',
    ptProjName,
    paths.book,
    paths.chapter,
    paths.chapterFile,
    '-x',
  ]);
};

const doChapter = async (
  plan: string,
  chap: string,
  passInfo: PassageInfo[],
  ptProjName: string,
  memory: Memory,
  userId: string,
  addNumberToSection: boolean
) => {
  const paths = await paratextPaths(chap);

  let usxDom: Document = await getChapter(paths, ptProjName);

  passInfo = passInfo.sort(
    (i, j) => (i.passage?.startVerse || 0) - (j.passage?.startVerse || 0)
  );
  passInfo.forEach((p) => {
    postPass(usxDom, p, memory);
  });

  const { stdoutw } = await writeChapter(paths, ptProjName, usxDom);
  if (stdoutw) console.log(stdoutw);
  var ops: Operation[] = [];
  var tb = new TransformBuilder();
  for (let p of passInfo) {
    var cmt = p.passage.attributes.lastComment;
    p.passage.attributes.lastComment = '';
    UpdateMediaStateOps(
      p.mediaId,
      p.passage.id,
      ActivityStates.Done,
      userId,
      tb,
      ops,
      memory,
      'Paratext-' + cmt
    );
  }
  await memory.update(ops);

  fs.unlinkSync(paths.chapterFile);
};

export const getLocalParatextText = async (
  pass: Passage,
  ptProjName: string
) => {
  parseRef(pass);
  const chap = pass.attributes.book + '-' + pass.startChapter;
  const paths = await paratextPaths(chap);

  let usxDom: Document = await getChapter(paths, ptProjName);
  return getPassageVerses(usxDom, pass);
};

export const localSync = async (
  plan: string,
  ptProjName: string,
  mediafiles: MediaFile[],
  passages: Passage[],
  memory: Memory,
  userId: string,
  artifactId: string | null,
  getTranscription: (passId: string, artifactId: string | null) => string,
  checkVersion: boolean
) => {
  let chapChg: { [key: string]: PassageInfo[] } = {};
  let probablyready = mediafiles.filter(
    (m) =>
      related(m, 'plan') === plan &&
      related(m, 'artifactType') === artifactId && //will this find vernacular?
      m.attributes?.transcriptionstate === ActivityStates.Approved
  );
  //ensure this is the latest mediafile for the passage
  let ready: PassageInfo[] = [];
  probablyready.forEach((pr) => {
    const passageId = related(pr, 'passage');
    const prVer = pr.attributes?.versionNumber;
    var newer = [];
    if (checkVersion) {
      newer = mediafiles.filter(
        (m) =>
          related(m, 'passage') === passageId &&
          related(m, 'artifactType') === artifactId &&
          m.attributes.versionNumber > prVer
      );
    }
    if (newer.length === 0) {
      const passage = passages.find((p) => p.id === passageId);
      if (passage)
        ready.push({
          passage: passage,
          mediaId: pr.id,
          transcription: getTranscription(passage.id, artifactId).replace(
            '\n',
            ' '
          ),
        });
    }
  });
  ready.forEach((r) => {
    parseRef(r.passage);
    let chap = r.passage.startChapter;
    if (chap) {
      const k = r.passage.attributes?.book + '-' + chap;
      if (chapChg.hasOwnProperty(k)) {
        chapChg[k].push(r);
      } else {
        chapChg[k] = [r];
      }
    }
  });
  for (let c of Object.keys(chapChg)) {
    try {
      await doChapter(plan, c, chapChg[c], ptProjName, memory, userId, false);
    } catch (error: any) {
      return error.message.replace(
        'Missing Localizer implementation. English text will be used instead.',
        ''
      );
    }
  }
  return '';
};
export default localSync;
