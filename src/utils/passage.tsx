import { Passage } from '../model';

export function passageNumber(passage: Passage) {
  return passage.attributes.sequencenum
    ? passage.attributes.sequencenum.toString().padStart(3, ' ')
    : '';
}
