import { Passage } from '../model';
import { numCompare } from './sort';

export function passageNumber(passage: Passage) {
  return passage.attributes && passage.attributes.sequencenum
    ? passage.attributes.sequencenum.toString().padStart(3, ' ')
    : '';
}

export function passageCompare(a: Passage, b: Passage) {
  return numCompare(
    a.attributes ? a.attributes.sequencenum : 0,
    b.attributes ? b.attributes.sequencenum : 0
  );
}

function TryParseInt(str: string, defaultValue: number): number {
  let retValue = parseInt(str);
  if (isNaN(retValue)) retValue = defaultValue;
  return retValue;
}

function parseReferencePart(a: Passage, start: boolean, part: string) {
  let colon = part.indexOf(':');
  let chapter: number = 0;
  let verse: number = 0;
  if (colon > 0) {
    chapter = TryParseInt(a.attributes.reference.substring(0, colon), 0);
    part = part.substring(colon + 1);
  }
  verse = TryParseInt(part, 0);
  if (start) {
    a.startChapter = chapter === 0 ? 1 : chapter;
    a.startVerse = verse;
  } else {
    a.endChapter = chapter === 0 ? a.startChapter : chapter;
    a.endVerse = verse === 0 ? a.startVerse : verse;
  }
}
function parseRef(a: Passage) {
  if (a.startChapter === undefined) {
    if (a.attributes.book === '') {
      a.startChapter = 0;
      a.endChapter = 0;
      a.startVerse = 0;
      a.endVerse = 0;
    } else {
      let dash = a.attributes.reference.indexOf('-');
      let firstPart =
        dash > 0
          ? a.attributes.reference.substring(0, dash)
          : a.attributes.reference;
      parseReferencePart(a, true, firstPart);
      if (dash > 0) {
        parseReferencePart(
          a,
          false,
          a.attributes.reference.substring(dash + 1)
        );
      } else {
        a.endChapter = a.startChapter;
        a.endVerse = a.startVerse;
      }
    }
  }
}
export function passageRefCompare(a: Passage, b: Passage) {
  if (!a.attributes || !b.attributes) return -1;

  parseRef(a);
  parseRef(b);
  return a.startChapter === b.startChapter
    ? a.startVerse === b.startVerse
      ? a.attributes.reference < b.attributes.reference
        ? -1
        : 1
      : a.startVerse < b.startVerse
      ? -1
      : 1
    : a.startChapter < b.startChapter
    ? -1
    : 1;
}

/* build the passage name = sequence + book + reference */
export function passageDescription(passage: Passage) {
  const attr = passage.attributes;
  if (!attr) return '';
  const book = attr.book ? attr.book + ' ' : '';
  const reference = attr.reference ? attr.reference : '';
  return passageNumber(passage) + '\u00A0\u00A0' + book + reference;
}

/* build the passage ref = book + reference */
export function passageReference(passage: Passage) {
  const attr = passage.attributes;
  if (!attr) return '';
  const book = attr.book ? attr.book + ' ' : '';
  const reference = attr.reference ? attr.reference : '';
  return book + reference;
}
