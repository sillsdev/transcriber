import { Passage } from '../model';

export function passageNumber(passage: Passage) {
  return passage.attributes && passage.attributes.sequencenum
    ? passage.attributes.sequencenum.toString().padStart(3, ' ')
    : '';
}
const numCompare = (a: number, b: number) => {
  return a - b;
};
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
