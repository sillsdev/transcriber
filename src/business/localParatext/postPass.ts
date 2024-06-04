import Memory from '@orbit/memory';
import { parseRef } from '../../crud/passage';
import { PassageInfo } from './PassageInfo';
import { vInt } from './vInt';
import { getLastVerse } from './getLastVerse';
import { parseTranscription } from './parseTranscription';
import { getExistingVerses, getVerses } from './usxNodeContent';
import {
  addParatextVerse,
  addSection,
  findNodeAfterVerse,
  moveToPara,
  removeOverlappingVerses,
  removeSection,
  removeVerse,
  replaceText,
} from './usxNodeChange';
import { isSection } from './usxNodeType';
import { Passage } from '../../model';
import { crossChapterRefs } from './crossChapterRefs';

const passageVerses = (p: Passage) =>
  (p?.attributes.startVerse || 0).toString() +
  ((p?.attributes.endVerse || 0) > (p?.attributes.startVerse || 0)
    ? '-' + (p?.attributes.endVerse || 0).toString()
    : '');

export interface IPostPass {
  doc: Document;
  chap: string;
  currentPI: PassageInfo;
  exportNumbers: boolean;
  sectionArr: [number, string][] | undefined;
  memory: Memory;
}

export const postPass = ({
  doc,
  chap,
  currentPI,
  exportNumbers,
  sectionArr,
  memory,
}: IPostPass) => {
  //get transcription
  var transcription = currentPI.transcription;
  const hasVerse = transcription.indexOf('\\v') > -1;

  // set start and end for currently loaded chapter
  const curChap = vInt(chap);
  const curPass = {
    ...currentPI.passage,
    attributes: { ...currentPI.passage.attributes },
  };
  parseRef(curPass);
  const { book, startChapter, endChapter } = curPass.attributes;
  if (startChapter !== endChapter && !hasVerse) {
    const primChap = crossChapterRefs(curPass);
    if (primChap !== startChapter) {
      curPass.attributes.startChapter = primChap;
      curPass.attributes.startVerse = 1;
    } else {
      curPass.attributes.endVerse = getLastVerse(book, curChap);
    }
  }

  var parsed = parseTranscription(curPass, transcription);
  if (parsed.length > 1) {
    //remove original range if it exists and we're replacing with multiple
    var existing = getExistingVerses(doc, curPass);
    if (existing.exactVerse) removeVerse(existing.exactVerse);
    existing.allVerses.forEach((v) => {
      if (isSection(v)) removeSection(v);
    });
  }
  var altRef =
    !hasVerse &&
    currentPI.passage.attributes.startChapter !==
      currentPI.passage.attributes.endChapter
      ? `[${currentPI.passage.attributes.reference}] `
      : '';
  parsed
    .filter((p) => p.attributes.startChapter === curChap)
    .forEach((p) => {
      //remove existing verses
      var thisVerse = removeOverlappingVerses(doc, p);

      if (thisVerse) {
        thisVerse = moveToPara(doc, thisVerse);
        replaceText(doc, thisVerse, altRef + p.attributes.lastComment);
      } else {
        let verses = getVerses(doc.documentElement);
        var nextVerse = findNodeAfterVerse(
          doc,
          verses,
          p?.attributes.startVerse || 0,
          p?.attributes.endVerse || 0
        );
        thisVerse = addParatextVerse(
          doc,
          nextVerse,
          passageVerses(p),
          altRef + p.attributes.lastComment,
          true
        );
      }
      if (p.attributes.sequencenum === 1) {
        addSection(doc, p, thisVerse, memory, exportNumbers, sectionArr);
      }
    });
};
