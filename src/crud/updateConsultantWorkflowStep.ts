import { Operation, QueryBuilder, TransformBuilder } from '@orbit/data';
import MemorySource from '@orbit/memory';
import { OrgWorkflowStep, WorkflowStep } from '../model';
import { UpdateLastModifiedBy } from '../model/baseModel';
import { remoteId } from './remoteId';

async function getSteps(
  token: string | null,
  table: string,
  memory: MemorySource
) {
  const steps = (await memory.query((q: QueryBuilder) =>
    q.findRecords(table)
  )) as OrgWorkflowStep[] | WorkflowStep[];
  return steps.filter(
    (s) =>
      Boolean(remoteId(table, s.id, memory.keyMap)) === Boolean(token) &&
      /Consultant/i.test(s.attributes.name) &&
      /discuss/i.test(s.attributes.tool) &&
      s.attributes.dateUpdated < '2023-08-25'
  );
}

async function migrate(
  token: string | null,
  table: string,
  memory: MemorySource,
  user: string,
  ops: Operation[],
  tb: TransformBuilder
) {
  for (const s of await getSteps(token, table, memory)) {
    if (s.id)
      ops.push(
        tb.replaceAttribute(s, 'tool', '{"tool": "consultantCheck"}'),
        ...UpdateLastModifiedBy(tb, s, user)
      );
  }
}

export const updateConsultantWorkflowStep = async (
  token: string | null,
  memory: MemorySource,
  user: string
) => {
  const ops: Operation[] = [];
  const tb = new TransformBuilder();
  migrate(token, 'orgworkflowstep', memory, user, ops, tb);
  await memory.update(ops);
};
