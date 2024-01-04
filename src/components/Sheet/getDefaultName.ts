import { ISheet, Section, Plan, IwsKind } from '../../model';
import { findRecord, related } from '../../crud';
import Memory from '@orbit/memory';
import { cleanFileName } from '../../utils';

export const getDefaultName = (
  ws: ISheet | undefined,
  tag: string,
  memory: Memory,
  planId: string
) => {
  const secId = ws?.sectionId?.id ?? related(ws?.passage, 'section');
  const secRec = secId
    ? (findRecord(memory, 'section', secId) as Section)
    : undefined;
  const planRec = findRecord(memory, 'plan', planId) as Plan;
  const defaultName =
    ws?.kind === IwsKind.Section
      ? `${planRec?.attributes.name ?? ''}_${ws?.sectionSeq}_${
          planRec?.keys?.remoteId || planRec?.id
        }_${secRec?.keys?.remoteId || secRec?.id || ''}_${tag}`
      : `${ws?.book ?? ''}_${ws?.reference ?? ''}_${ws?.sectionSeq ?? ''}_${
          ws?.passageSeq ?? ''
        }_${planRec?.keys?.remoteId || planRec?.id}_${
          secRec?.keys?.remoteId || secRec?.id
        }_${ws?.passage?.keys?.remoteId || ws?.passage?.id}_${tag}`;
  return cleanFileName(defaultName.replace(/\s/g, '_'));
};
