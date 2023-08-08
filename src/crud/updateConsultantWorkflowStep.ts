import { Operation, QueryBuilder, TransformBuilder } from '@orbit/data';
import MemorySource from '@orbit/memory';
import { OrgWorkflowStep, WorkflowStep } from '../model';
import { UpdateRecord } from '../model/baseModel';

const migrateConsultantCheck = async (
  table: string,
  memory: MemorySource,
  user: string
) => {
  const steps = memory.cache.query((q: QueryBuilder) =>
    q.findRecords(table)
  ) as WorkflowStep[] | OrgWorkflowStep[];
  const consultantSteps = steps.filter((s) =>
    /Consultant/.test(s.attributes.name)
  );
  const ops: Operation[] = [];
  const t = new TransformBuilder();
  consultantSteps.forEach((s) => {
    ops.push(
      ...UpdateRecord(
        t,
        {
          ...s,
          attributes: { ...s.attributes, tool: '{"tool": "consultantCheck"}' },
        } as WorkflowStep | OrgWorkflowStep,
        user
      )
    );
  });
  await memory.update(ops);
};

export const updateConsultantWorkflowStep = async (
  memory: MemorySource,
  user: string
) => {
  await migrateConsultantCheck('workflowstep', memory, user);
  await migrateConsultantCheck('orgworkflowstep', memory, user);
};
