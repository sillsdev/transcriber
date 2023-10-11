import { ISheet, Section, Plan, IwsKind } from '../../model';
import { findRecord, related } from '../../crud';
import Memory from '@orbit/memory';

export const getDefaultName = (
  ws: ISheet | undefined,
  tag: string,
  memory: Memory
) => {
  const secId = ws?.sectionId?.id ?? related(ws?.passage, 'section');
  const secRec = secId
    ? (findRecord(memory, 'section', secId) as Section)
    : undefined;
  const planId = related(secRec, 'plan') as string | undefined;
  const planRec = planId
    ? (findRecord(memory, 'plan', planId) as Plan)
    : undefined;
  const defaultName =
    ws?.kind === IwsKind.Section
      ? `${planRec?.attributes.name ?? ''}_${ws?.sectionSeq}_${
          planRec?.keys?.remoteId || planRec?.id
        }_${secRec?.keys?.remoteId || secRec?.id}_${tag}`
      : `${ws?.book ?? ''}_${ws?.reference ?? ''}_${ws?.sectionSeq ?? ''}_${
          ws?.passageSeq ?? ''
        }_${planRec?.keys?.remoteId || planRec?.id}_${
          secRec?.keys?.remoteId || secRec?.id
        }_${ws?.passage?.keys?.remoteId || ws?.passage?.id}_${tag}`;
  return defaultName;
};
