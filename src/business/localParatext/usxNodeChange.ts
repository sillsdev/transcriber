import Memory from '@orbit/memory';
import { related } from '../../crud/related';
import { Passage, Section } from '../../model';
import {
  domVnum,
  firstVerse,
  getExistingVerses,
  getVerses,
} from './usxNodeContent';
import {
  isAfterSection,
  isEmptyPara,
  isNote,
  isPara,
  isSection,
  isVerse,
} from './usxNodeType';

export const removeTimestamps = (transcript: string | null) =>
  transcript
    ? transcript.replace(/\([0-9]{1,2}:[0-9]{2}(:[0-9]{2})?\)/g, '')
    : '';

export const newEl = (
  doc: Document,
  tag: string,
  style: string,
  vNum?: string
) => {
  const el = doc.createElement(tag);
  if (vNum) el.setAttribute('number', vNum);
  el.setAttribute('style', style);
  return el;
};

export const addAfter = (
  doc: Document,
  last: Node | null | undefined,
  next: Node
) =>
  last?.nextSibling
    ? last?.parentNode?.insertBefore(next, last.nextSibling)
    : last?.parentNode
    ? last?.parentNode.appendChild(next)
    : doc.documentElement.appendChild(next);

export const paratextPara = (
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

export const paratextSection = (doc: Document, text: string) => {
  return paratextPara(doc, 's', doc.createTextNode(text));
};

export const moveToPara = (doc: Document, verse: Element) => {
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
    var para = verse.parentNode?.insertBefore(paratextPara(doc, 'p'), verse);
    para?.appendChild(verse);
    return para;
  }
};

export const findNodeAfterVerse = (
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
    var style = after?.getAttribute('style');
    if (style && style.startsWith('q')) {
      var level = parseInt(style.substring(1)) || 0;
      while (level > 1) {
        if (
          after?.parentNode &&
          (after.parentNode as Element).getAttribute('style') &&
          (after.parentNode as Element).getAttribute('style')?.startsWith('q')
        )
          //we don't want to put our stuff in between q levels
          //find the q1 - I'd expect it to be my parent...but it's a previous sibling...
          after = after.parentNode as Element;
        else after = after?.previousSibling as Element;
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
    if (after && isAfterSection(after)) {
      return isAfterSection(after);
    }
  }
  return after;
};

export interface IaddSection {
  doc: Document;
  passage: Passage;
  verse: Element;
  memory: Memory;
  addNumbers?: boolean;
  sectionArr?: [number, string][];
}

export const addSection = ({
  doc,
  passage,
  verse,
  memory,
  addNumbers = true,
  sectionArr = [],
}: IaddSection) => {
  var sections = memory.cache.query((q) =>
    q.findRecords('section')
  ) as Section[];
  /* get the section for this passage to get the plan */
  const sectionId = related(passage, 'section');
  const sectionRec = sections.filter((s) => s.id === sectionId)[0];
  var para = moveToPara(doc, verse);
  const seqnum = sectionRec.attributes.sequencenum;
  const sectionMap = new Map(sectionArr);
  const mapNum = sectionMap?.get(seqnum);
  const sectionNode = paratextSection(
    doc,
    (addNumbers ? (mapNum ?? seqnum.toString()) + ' - ' : '') +
      sectionRec.attributes.name
  );
  return para?.parentNode?.insertBefore(sectionNode, para);
};

export const paratextVerse = (
  doc: Document,
  verses: string,
  transcript: string
) => {
  var para = paratextPara(doc, 'p', newEl(doc, 'verse', 'v', verses));
  if (transcript && transcript !== '')
    para.appendChild(doc.createTextNode(transcript));
  return para;
};

export interface IaddParatextVerse {
  doc: Document;
  sibling: Node | null | undefined;
  verses: string;
  transcript: string;
  before?: boolean;
}

export const addParatextVerse = ({
  doc,
  sibling,
  verses,
  transcript,
  before = false,
}: IaddParatextVerse) => {
  var lines: string[] = removeTimestamps(transcript).split('\n');
  var first = paratextVerse(doc, verses, lines[0]);
  if (before && sibling) sibling.parentNode?.insertBefore(first, sibling);
  else addAfter(doc, sibling, first);

  var last = first;
  for (var ix = 1; ix < lines.length; ix++) {
    addAfter(doc, last, paratextPara(doc, 'p', doc.createTextNode(lines[ix])));
    last = last?.nextSibling as HTMLElement;
  }

  return first;
};

export const removeSection = (v: Element) => v.parentNode?.removeChild(v);

export const removeText = (v: Element) => {
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

export const replaceText = (
  doc: Document,
  para: Element,
  transcript: string
) => {
  //remove text
  var verse = firstVerse(para);
  removeText(verse);
  var lines: string[] = removeTimestamps(transcript).split('\n');
  var last = addAfter(doc, verse, doc.createTextNode(lines[0]));
  //var last = para;
  for (var ix = 1; ix < lines.length; ix++) {
    addAfter(doc, last, paratextPara(doc, 'p', doc.createTextNode(lines[ix])));
    last = last?.nextSibling as HTMLElement;
  }
};

export const removeVerse = (v: Element) => {
  if (!isVerse(v)) return;
  var removeParent =
    v.parentNode !== null && getVerses(v.parentNode).length === 1
      ? v.parentNode
      : null;
  removeText(v);
  v.parentNode?.removeChild(v);
  if (removeParent != null && isEmptyPara(removeParent))
    removeParent.parentNode?.removeChild(removeParent);
};

export const removeOverlappingVerses = (doc: Document, p: Passage) => {
  const existing = getExistingVerses(doc, p);
  existing.allVerses.forEach((v) => {
    if (isVerse(v)) removeVerse(v);
    else removeSection(v);
  });
  return existing.exactVerse;
};
