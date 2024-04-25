import { ISheet } from '../../model';

export const isSectionAdding = (ws: ISheet) => (ws?.sectionId?.id || '') === '';

export const isSectionUpdated = (ws: ISheet, lastSaved?: string) => {
  if (isSectionAdding(ws)) return true;
  const deleting = ws?.deleted;
  if (deleting) return true;
  const changed =
    lastSaved && ws?.sectionUpdated
      ? ws.sectionUpdated > lastSaved
      : Boolean(ws?.sectionUpdated as string);
  return changed;
};

export const isPassageAdding = (ws: ISheet) => (ws?.passage?.id || '') === '';

export const isPassageUpdated = (ws: ISheet, lastSaved?: string) => {
  if (isPassageAdding(ws)) return true;
  const deleting = ws?.deleted;
  if (deleting) return true;
  const changed =
    lastSaved && ws?.passageUpdated
      ? ws.passageUpdated > lastSaved
      : Boolean(ws?.passageUpdated as string);
  return changed;
};
