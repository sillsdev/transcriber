import { OrgWorkflowStep, StepComplete } from '../model';

interface IGetNextStepProps {
  psgCompleted: StepComplete[];
  orgWorkflowSteps: OrgWorkflowStep[];
}

export const getNextStep = (state: IGetNextStepProps) => {
  let nextIndex = 0;
  for (let w of state.orgWorkflowSteps) {
    const pcItem = state.psgCompleted.find(
      (s) => s.name === w.attributes?.name
    );
    const id = w.keys?.remoteId || w.id;
    if (id === pcItem?.stepid && pcItem?.complete) {
      nextIndex += 1;
    } else break;
  }
  nextIndex = Math.min(nextIndex, state.orgWorkflowSteps.length - 1);
  return state.orgWorkflowSteps[nextIndex]?.id;
};
