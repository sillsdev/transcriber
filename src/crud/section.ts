import { Section, User } from '../model';
import { related } from '.';
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
/* build the section name = sequence + name */
export function sectionDescription(section: Section) {
  const name = section?.attributes?.name || '';
  return sectionNumber(section) + '\u00A0\u00A0 ' + name;
}
