import { Section } from '../model';
import { TransformBuilder, RecordIdentity } from '@orbit/data';
import Memory from '@orbit/memory';
import { AddRecord, ReplaceRelatedRecord } from '../model/baseModel';

interface IProps {
  sequencenum: number;
  name: string;
  plan: RecordIdentity;
  memory: Memory;
  user: string;
}

export const saveNewSection = async (props: IProps) => {
  const { sequencenum, name, plan, memory, user } = props;
  const sec: Section = {
    type: 'section',
    attributes: {
      sequencenum,
      name,
    },
  } as any;
  await memory.update((t: TransformBuilder) => [
    ...AddRecord(t, sec, user, memory),
    ...ReplaceRelatedRecord(t, sec, 'plan', 'plan', plan.id),
  ]);
  return sec;
};
