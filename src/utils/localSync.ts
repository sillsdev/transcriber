import { Passage, ActivityStates, MediaFile, Section } from '../model';
import Memory from '@orbit/memory';
import { getMediaProjRec, getMediaRec } from '.';
import { DOMParser, XMLSerializer } from 'xmldom';
import xpath from 'xpath';
import { QueryBuilder, TransformBuilder, Record } from '@orbit/data';
import related from './related';
import { getParatextProgPath } from './paratextPath';

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

const domVnum = (v: Element) => {
  const vrefAttr = v.getAttribute('number');
  const vrefMatch = vrefAttr ? vrefRe.exec(vrefAttr) : null;
  if (vrefMatch) {
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    const [_, vstart, vend] = vrefMatch;
    return [vInt(vstart), vInt(vend)];
  }
  return [];
};

const newEl = (doc: Document, tag: string, style: string, vNum?: string) => {
  const el = doc.createElement(tag);
  if (vNum) el.setAttribute('number', vNum);
  el.setAttribute('style', style);
  return el;
};

const getSection = (passage: Passage, memory: Memory) => {
  const sectionId = related(passage, 'section');
  const sections = memory.cache.query((q: QueryBuilder) =>
    q.findRecords('section')
  ) as Section[];
  const sectionRecs = sections.filter(s => s.id === sectionId);
  return sectionRecs[0];
};

const rmNodeTx = (doc: Document, node: Node) => {
  if (node.nextSibling?.nodeType === doc.TEXT_NODE) {
    doc.removeChild(node.nextSibling);
  }
  while (node.firstChild) node.removeChild(node.firstChild);
  doc.removeChild(node);
};

const postPass = (doc: Document, p: Passage, memory: Memory) => {
  const refMatch = refRe.exec(p.attributes.reference);
  if (!refMatch) return;
  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  const [_, mstart, mend] = refMatch;
  const start = vInt(mstart);
  const end = vInt(mend);
  let verses = xpath.select('//verse', doc) as Element[];
  const existing = Array<Element>();
  verses.forEach(v => {
    const [vstart, vend] = domVnum(v);
    if (vstart) {
      let result =
        end && vend
          ? vstart >= start && vstart <= end && vend >= start && vend <= end
          : end
          ? vstart >= start && vstart <= end
          : vstart === start;
      if (result) existing.push(v);
    }
  });
  existing.forEach(e => {
    const para = e.parentNode;
    if (para) {
      const vrs = xpath.select('.//verse', para) as Element[];
      if (vrs.length === 1) {
        let secHd = para.previousSibling;
        if (secHd?.nodeType === doc.TEXT_NODE) secHd = secHd.previousSibling;
        if (secHd && secHd.nodeType === doc.ELEMENT_NODE) {
          const secSt = (secHd as Element).getAttribute('style');
          if (secSt && secSt === 's') {
            rmNodeTx(doc, secHd);
          }
        }
        rmNodeTx(doc, para);
      } else {
        rmNodeTx(doc, e);
      }
    }
  });
  verses = xpath.select('//verse', doc) as Element[];
  const media = related(p, 'mediafiles') as Record[];
  const sortedMedia = media
    .map(
      m => memory.cache.query((q: QueryBuilder) => q.findRecord(m)) as MediaFile
    )
    .sort((i, j) =>
      i.attributes.versionNumber > j.attributes.versionNumber ? -1 : 1
    );
  const transcript = sortedMedia[0].attributes.transcription;
  const vEl = newEl(doc, 'verse', 'v', end ? mstart + '-' + mend : mstart);
  const pEl = newEl(doc, 'para', 'p');
  pEl.appendChild(vEl);
  pEl.appendChild(
    doc.createTextNode(
      transcript
        ? transcript.replace(/\([0-9]{1,2}:[0-9]{2}(:[0-9]{2})?\)/g, '')
        : ''
    )
  );
  let sEl: Element | null = null;
  if (p.attributes.sequencenum === 1) {
    const section = getSection(p, memory);
    sEl = newEl(doc, 'para', 's');
    sEl.appendChild(doc.createTextNode(section.attributes.name));
  }
  let after: Element | undefined;
  let vaft: number = 9999;
  verses.forEach(v => {
    const [vstart] = domVnum(v);
    if (vstart > start && vstart < vaft) {
      vaft = vstart;
      after = v;
    }
  });
  if (after) {
    const afterPara = after.parentNode as Element;
    if (afterPara) {
      if (after.previousSibling) {
        const p2El = newEl(doc, 'para', 'p');
        doc.insertBefore(p2El, afterPara);
        let child: Node | null = afterPara.firstChild;
        while (child !== after) {
          if (child) {
            let nextEl = child.nextSibling;
            p2El.appendChild(child);
            child = nextEl;
          } else break;
        }
      }
      if (sEl) doc.insertBefore(sEl, afterPara);
      doc.insertBefore(pEl, afterPara);
    } else
      throw new Error(
        p.attributes.book +
          ' ' +
          p.attributes.reference +
          ' has verses not in paragraphs'
      );
  } else {
    if (sEl) doc.appendChild(sEl);
    doc.appendChild(pEl);
  }
};

const doPassage = async (
  chap: string,
  pass: Passage[],
  ptProjName: string,
  memory: Memory
) => {
  if (!temp) return;
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
  pass.forEach(p => {
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
  for (let p of pass) {
    await memory.update((t: TransformBuilder) =>
      t.replaceAttribute(p, 'state', ActivityStates.Done)
    );
  }
  fs.unlinkSync(tempName);
};

export const localSync = async (
  project: string,
  ptProjName: string,
  passages: Passage[],
  memory: Memory
) => {
  let chapChg: { [key: string]: Passage[] } = {};
  passages
    .filter(p => p.attributes.state === ActivityStates.Approved)
    .filter(p => {
      const projRec = getMediaProjRec(getMediaRec(p.id, memory), memory);
      return projRec && projRec.id === project;
    })
    .forEach(p => {
      let chap = /[0-9]+/.exec(p.attributes.reference);
      if (chap && chap.length > 0) {
        const k = p.attributes.book + '-' + chap[0];
        if (chapChg.hasOwnProperty(k)) {
          chapChg[k].push(p);
        } else {
          chapChg[k] = [p];
        }
      }
    });
  for (let c of Object.keys(chapChg)) {
    await doPassage(c, chapChg[c], ptProjName, memory);
  }
};
export default localSync;
