import { Passage, ActivityStates } from '../model';
import { RecordIdentity } from '@orbit/data';
import Memory from '@orbit/memory';
import { AddPassage } from '../utils/UpdatePassageState';

interface IProps {
  sequencenum: number;
  reference: string;
  section: RecordIdentity;
  memory: Memory;
  book?: string;
  title?: string;
  userId: number;
}

export const saveNewPassage = async (props: IProps) => {
  const {
    sequencenum,
    reference,
    section,
    memory,
    book,
    title,
    userId,
  } = props;

  const passage: Passage = {
    type: 'passage',
    attributes: {
      sequencenum,
      book,
      reference,
      title,
      position: 0,
      hold: false,
      state: ActivityStates.NoMedia,
    },
  } as any;
  await memory.update(AddPassage(passage, section, userId, memory));
  return passage;
};
