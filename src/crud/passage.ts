import { Passage, BookName } from '../model';
import { numCompare } from '../utils/sort';

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
  let colon = (part ?? '').indexOf(':');
  let chapter: number = 0;
  let verse: number = 0;
  if (colon > 0) {
    chapter = TryParseInt(part.substring(0, colon), 0);
    part = part.substring(colon + 1);
  }
  verse = TryParseInt(part, 0);
  if (start) {
    a.startChapter = chapter;
    a.startVerse = verse;
  } else {
    a.endChapter = chapter === 0 ? a.startChapter : chapter;
    a.endVerse = verse === 0 ? a.startVerse : verse;
  }
}
export function parseRef(a: Passage) {
  if (a.startChapter === undefined) {
    if (a.attributes.book === '' || (a.attributes.reference ?? '') === '') {
      a.startChapter = 0;
      a.endChapter = 0;
      a.startVerse = 0;
      a.endVerse = 0;
    } else {
      let dash = a.attributes?.reference.indexOf('-');
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
export function passageBook(passage: Passage, bookData: BookName[] = []) {
  const attr = passage.attributes;
  let book = attr?.book || '';
  if (book !== '') {
    const bookItem = bookData.filter((b) => b.code === book);
    if (bookItem.length > 0) {
      book = bookItem[0].abbr;
    }
  }
  return book;
}
/* build the passage ref = book + reference */
export function passageReference(passage: Passage, bookData: BookName[] = []) {
  var book = passageBook(passage, bookData);
  book += ' ';
  return book + passage.attributes?.reference;
}

/* build the passage name = sequence + book + reference */
export function passageDescription(
  passage: Passage,
  bookData: BookName[] = []
) {
  return (
    passageNumber(passage) +
    '\u00A0\u00A0' +
    passageReference(passage, bookData)
  );
}
