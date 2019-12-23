import { Plan } from '../model';
import { TransformBuilder, Schema } from '@orbit/data';
import Memory from '@orbit/memory';

interface IProps {
  project: string;
  name: string;
  planType: string;
  schema: Schema;
  memory: Memory;
}

export const saveNewPlan = async (props: IProps) => {
  const { project, name, planType, schema, memory } = props;

  let plan: Plan = {
    type: 'plan',
    attributes: {
      name,
    },
  } as any;
  schema.initializeRecord(plan);
  await memory.update((t: TransformBuilder) => [
    t.addRecord(plan),
    t.replaceRelatedRecord(plan, 'plantype', {
      type: 'plantype',
      id: planType,
    }),
    t.replaceRelatedRecord(plan, 'project', {
      type: 'project',
      id: project,
    }),
  ]);
  return plan;
};
