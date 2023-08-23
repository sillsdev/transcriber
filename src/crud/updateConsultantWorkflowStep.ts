import { Operation, QueryBuilder, TransformBuilder } from '@orbit/data';
import MemorySource from '@orbit/memory';
import { OrgWorkflowStep, WorkflowStep } from '../model';
import { UpdateLastModifiedBy } from '../model/baseModel';
import remoteId, { remoteIdGuid } from './remoteId';

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
      /Consultant/.test(s.attributes.name) &&
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
    const recId = {
      type: table,
      id: remoteIdGuid(table, s.id ?? '', memory.keyMap) || s.id || '',
    };
    ops.push(
      tb.replaceAttribute(recId, 'tool', '{"tool": "consultantCheck"}'),
      ...UpdateLastModifiedBy(tb, recId, user)
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
  migrate(token, 'workflowstep', memory, user, ops, tb);
  await memory.update(ops);
};
