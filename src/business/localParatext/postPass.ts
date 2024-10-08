import Memory from '@orbit/memory';
import { parseRef } from '../../crud/passage';
import { PassageInfo } from './PassageInfo';
import { vInt } from './vInt';
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
  currentPI.passage.attributes.startChapter = undefined;
  parseRef(currentPI.passage);
  const curPass = {
    ...currentPI.passage,
    attributes: { ...currentPI.passage.attributes },
  };
  const { startChapter, endChapter } = curPass.attributes;
  if (startChapter !== endChapter && !hasVerse) {
    curPass.attributes.startChapter = crossChapterRefs(curPass);
  }

  const parsed = parseTranscription(curPass, transcription);
  if (parsed.length > 1) {
    //remove original range if it exists and we're replacing with multiple
    var existing = getExistingVerses(doc, curPass);
    if (existing.exactVerse) removeVerse(existing.exactVerse);
    existing.allVerses.forEach((v) => {
      if (isSection(v)) removeSection(v);
    });
  }
  const altRef =
    !hasVerse &&
    currentPI.passage.attributes.startChapter !==
      currentPI.passage.attributes.endChapter
      ? `[${curPass.attributes.reference}] `
      : '';
  parsed
    .filter((p) => p.attributes.startChapter === curChap)
    .forEach((p) => {
      //remove existing verses
      var thisVerse = removeOverlappingVerses(doc, p);

      if (thisVerse) {
        thisVerse = moveToPara(doc, thisVerse);
        if (thisVerse)
          replaceText(doc, thisVerse, altRef + p.attributes.lastComment);
      } else {
        let verses = getVerses(doc.documentElement);
        var nextVerse = findNodeAfterVerse(
          doc,
          verses,
          p?.attributes.startVerse || 0,
          p?.attributes.endVerse || 0
        );
        thisVerse = addParatextVerse({
          doc,
          sibling: nextVerse,
          verses: passageVerses(p),
          transcript: altRef + p.attributes.lastComment,
          before: true,
        });
      }
      if (p.attributes.sequencenum === 1 && thisVerse) {
        addSection({
          doc,
          passage: p,
          verse: thisVerse,
          memory,
          addNumbers: exportNumbers,
          sectionArr,
        });
      }
    });
};
