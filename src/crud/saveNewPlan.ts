import { Plan } from '../model';
import { TransformBuilder } from '@orbit/data';
import Memory from '@orbit/memory';

interface IProps {
  project: string;
  name: string;
  planType: string;
  memory: Memory;
}

export const saveNewPlan = async (props: IProps) => {
  const { project, name, planType, memory } = props;

  let plan: Plan = {
    type: 'plan',
    attributes: {
      name,
    },
  } as any;
  memory.schema.initializeRecord(plan);
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
