import { OrgWorkflowStep, StepComplete } from '../model';

interface IGetNextStepProps {
  psgCompleted: StepComplete[];
  orgWorkflowSteps: OrgWorkflowStep[];
}

export const getNextStep = (state: IGetNextStepProps) => {
  let nextIndex = 0;
  let completeLen = state.psgCompleted.length;
  for (let w of state.orgWorkflowSteps) {
    const pcItem =
      nextIndex < completeLen ? state.psgCompleted[nextIndex] : undefined;
    const id = w.keys?.remoteId || w.id;
    if (id === pcItem?.stepid && pcItem?.complete) {
      nextIndex += 1;
    } else break;
  }
  return state.orgWorkflowSteps[nextIndex]?.id;
};
