import { Section, SectionD } from '../model';
import { RecordIdentity } from '@orbit/records';
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
  await memory.update((t) => [
    ...AddRecord(t, sec, user, memory),
    ...ReplaceRelatedRecord(t, sec as RecordIdentity, 'plan', 'plan', plan.id),
  ]);
  return sec as SectionD;
};
