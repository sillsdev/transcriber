import { Section } from '../model';
import { TransformBuilder, RecordIdentity } from '@orbit/data';
import Memory from '@orbit/memory';
import { AddRecord } from '../model/baseModel';

interface IProps {
  sequencenum: number;
  name: string;
  plan: RecordIdentity;
  memory: Memory;
  userId: number;
}

export const saveNewSection = async (props: IProps) => {
  const { sequencenum, name, plan, memory, userId } = props;
  const sec: Section = {
    type: 'section',
    attributes: {
      sequencenum,
      name,
    },
  } as any;
  await memory.update((t: TransformBuilder) => [
    AddRecord(t, sec, userId, memory),
    t.replaceRelatedRecord(sec, 'plan', plan),
  ]);
  return sec;
};
