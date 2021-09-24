import { IWorkflow } from '../../model';

export const isSectionAdding = (wf: IWorkflow) =>
  (wf?.sectionId?.id || '') === '';

export const isSectionUpdated = (wf: IWorkflow, lastSaved?: string) => {
  if (isSectionAdding(wf)) return true;
  const deleting = wf?.deleted;
  if (deleting) return true;
  const changed =
    lastSaved && wf?.sectionUpdated
      ? wf.sectionUpdated > lastSaved
      : Boolean(wf?.sectionUpdated as string);
  return changed;
};

export const isPassageAdding = (wf: IWorkflow) =>
  (wf?.passageId?.id || '') === '';

export const isPassageUpdated = (wf: IWorkflow, lastSaved?: string) => {
  if (isPassageAdding(wf)) return true;
  const deleting = wf?.deleted;
  if (deleting) return true;
  const changed =
    lastSaved && wf?.passageUpdated
      ? wf.passageUpdated > lastSaved
      : Boolean(wf?.passageUpdated as string);
  return changed;
};
