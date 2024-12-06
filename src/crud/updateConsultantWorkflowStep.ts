import {
  RecordKeyMap,
  RecordOperation,
  RecordTransformBuilder,
} from '@orbit/records';
import MemorySource from '@orbit/memory';
import { OrgWorkflowStepD, WorkflowStepD } from '../model';
import { UpdateLastModifiedBy } from '../model/baseModel';
import { remoteId } from './remoteId';

async function getSteps(
  token: string | null,
  table: string,
  memory: MemorySource
) {
  const steps = (await memory.query((q) => q.findRecords(table))) as
    | OrgWorkflowStepD[]
    | WorkflowStepD[];
  return steps.filter(
    (s) =>
      Boolean(remoteId(table, s.id, memory?.keyMap as RecordKeyMap)) ===
        Boolean(token) &&
      /Consultant/i.test(s?.attributes?.name) &&
      /discuss/i.test(s?.attributes?.tool) &&
      s?.attributes?.dateUpdated < '2023-08-25'
  );
}

async function migrate(
  token: string | null,
  table: string,
  memory: MemorySource,
  user: string,
  ops: RecordOperation[],
  tb: RecordTransformBuilder
) {
  for (const s of await getSteps(token, table, memory)) {
    if (s.id)
      ops.push(
        tb
          .replaceAttribute(s, 'tool', '{"tool": "consultantCheck"}')
          .toOperation(),
        ...UpdateLastModifiedBy(tb, s, user)
      );
  }
}

export const updateConsultantWorkflowStep = async (
  token: string | null,
  memory: MemorySource,
  user: string
) => {
  const ops: RecordOperation[] = [];
  const tb = new RecordTransformBuilder();
  await migrate(token, 'orgworkflowstep', memory, user, ops, tb);
  await memory.update(ops);
};
