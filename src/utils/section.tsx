import { Section, User } from '../model';
import { related } from '.';
import { numCompare } from './sort';

export function sectionReviewer(s: Section, users: Array<User>) {
  var user = users.filter(u => u.id === related(s, 'reviewer'));
  return user.length > 0 ? user[0] : null;
}
export function sectionReviewerName(s: Section, users: Array<User>) {
  var user = sectionReviewer(s, users);
  return user == null ? '' : user.attributes.name;
}
export function sectionTranscriber(s: Section, users: Array<User>) {
  var user = users.filter(u => u.id === related(s, 'transcriber'));
  return user.length > 0 ? user[0] : null;
}
export function sectionTranscriberName(s: Section, users: Array<User>) {
  var user = sectionTranscriber(s, users);
  return user == null ? '' : user.attributes.name;
}
export function sectionNumber(section: Section) {
  return section.attributes && section.attributes.sequencenum
    ? section.attributes.sequencenum.toString().padStart(3, ' ')
    : '';
}
export function updatableSection(sectionIn: Section, updatedattributes: any) {
  let section: Section = {
    ...sectionIn,
    attributes: updatedattributes,
  };
  delete section.relationships;
  return section;
}

export function sectionCompare(a: Section, b: Section) {
  return numCompare(a.attributes.sequencenum, b.attributes.sequencenum);
}
