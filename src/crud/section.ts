import { Section, Passage, User, BookName } from '../model';
import { parseRef, passageBook, related } from '.';
import { numCompare } from '../utils/sort';

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
  return section?.attributes?.sequencenum?.toString().padStart(3, ' ') || '';
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
  return start?.startChapter && end?.startChapter
    ? `${passageBook(start, bookData)} ${start.startChapter}:${
        start.startVerse
      }-${
        end.endChapter !== start.startChapter
          ? end.endChapter?.toString() + ':'
          : ''
      }${end.endVerse}`
    : undefined;
}
/* build the section name = sequence + name */
export function sectionDescription(section: Section, passage?: Passage) {
  const name = section?.attributes?.name || '';
  const passNum = passage ? `.${passage.attributes?.sequencenum}` : '';
  return sectionNumber(section) + passNum + '\u00A0\u00A0 ' + name;
}
