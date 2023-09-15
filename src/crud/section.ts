import { Section, Passage, User, BookName } from '../model';
import { parseRef, passageBook, related } from '.';
import { numCompare } from '../utils/sort';
import { positiveWholeOnly } from '../utils';

function sectionReviewer(s: Section, users: Array<User>) {
  let user = users.filter((u) => u.id === related(s, 'editor'));
  return user.length > 0 ? user[0] : null;
}
export function sectionEditorName(s: Section, users: Array<User>) {
  let user = sectionReviewer(s, users);
  return user == null || !user.attributes ? '' : user.attributes.name;
}
function sectionTranscriber(s: Section, users: Array<User>) {
  let user = users.filter((u) => u.id === related(s, 'transcriber'));
  return user.length > 0 ? user[0] : null;
}
export function sectionTranscriberName(s: Section, users: Array<User>) {
  let user = sectionTranscriber(s, users);
  return user == null || !user.attributes ? '' : user.attributes.name;
}
export function sectionNumber(section: Section) {
  const num = positiveWholeOnly(section?.attributes?.sequencenum);
  return num ? num.padStart(3, ' ') : '';
}
export function sectionCompare(a: Section, b: Section) {
  return numCompare(a.attributes.sequencenum, b.attributes.sequencenum);
}
export function sectionRef(
  a: Section,
  passages: Passage[],
  bookData: BookName[]
) {
  let start: Passage | undefined;
  let end: Passage | undefined;
  if (passages.length > 0) {
    start = passages[0];
    end = passages[passages.length - 1];
    parseRef(start);
    parseRef(end);
  }
  return start?.attributes.startChapter && end?.attributes.startChapter
    ? `${passageBook(start, bookData)} ${start.attributes.startChapter}:${
        start.attributes.startVerse
      }-${
        end.attributes.endChapter !== start.attributes.startChapter
          ? end.attributes.endChapter?.toString() + ':'
          : ''
      }${end.attributes.endVerse}`
    : undefined;
}

/* build the section name = sequence + name */
export function sectionDescription(section: Section, passage?: Passage) {
  const name = section?.attributes?.name || '';
  const passNum = passage
    ? `.${positiveWholeOnly(passage.attributes?.sequencenum)}`
    : '';
  return sectionNumber(section) + passNum + '\u00A0\u00A0 ' + name;
}
