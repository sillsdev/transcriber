import { Section } from '../model';
import { TransformBuilder, Schema, RecordIdentity } from '@orbit/data';
import Memory from '@orbit/memory';

interface IProps {
  sequencenum: number;
  name: string;
  plan: RecordIdentity;
  schema: Schema;
  memory: Memory;
}

export const saveNewSection = async (props: IProps) => {
  const { sequencenum, name, plan, schema, memory } = props;
  const sec: Section = {
    type: 'section',
    attributes: {
      sequencenum,
      name,
    },
  } as any;
  schema.initializeRecord(sec);
  await memory.update((t: TransformBuilder) => [
    t.addRecord(sec),
    t.replaceRelatedRecord(sec, 'plan', plan),
  ]);
  return sec;
};
