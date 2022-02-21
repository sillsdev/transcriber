import { StepComplete, Passage } from '../model';

export const getStepComplete = (p: Passage) => {
  let complete = [] as StepComplete[];
  if (p.attributes.stepComplete) {
    const tmp = JSON.parse(p.attributes.stepComplete);
    if (tmp) complete = tmp.completed;
  }
  return complete;
};
