import { OrgWorkflowStep, StepComplete } from '../model';

interface IGetNextStepProps {
  psgCompleted: StepComplete[];
  orgWorkflowSteps: OrgWorkflowStep[];
  target?: string;
}

const lookupStep = (state: IGetNextStepProps) => {
  let nextIndex = 0;
  for (let w of state.orgWorkflowSteps) {
    const id = w.keys?.remoteId || w.id;
    const pcItem = state.psgCompleted.find((s) => s.stepid === id);
    if (pcItem?.complete && w.id !== state?.target) {
      nextIndex += 1;
    } else break;
  }
  return nextIndex;
};

export const getNextStep = (state: IGetNextStepProps) => {
  let nextIndex = lookupStep(state);
  nextIndex = Math.min(nextIndex, state.orgWorkflowSteps.length - 1);
  return state.orgWorkflowSteps[nextIndex]?.id;
};

export const afterStep = (state: IGetNextStepProps) => {
  let nextIndex = lookupStep(state);
  nextIndex = Math.min(nextIndex, state.orgWorkflowSteps.length - 1);
  return state.orgWorkflowSteps[nextIndex]?.id === state.target;
};
