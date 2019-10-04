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
export function passageRefCompare(a: Passage, b: Passage) {
  return (a.attributes ? a.attributes.reference : '') <
    (b.attributes ? b.attributes.reference : '')
    ? -1
    : 1;
}

/* build the passage name = sequence + book + reference */
export function passageDescription(passage: Passage) {
  const attr = passage.attributes;
  if (!attr) return '';
  const book = ' ' + (attr.book ? attr.book : '');
  const reference = ' ' + (attr.reference ? attr.reference : '');
  return passageNumber(passage) + book + reference;
}
