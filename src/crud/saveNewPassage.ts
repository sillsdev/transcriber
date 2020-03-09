import { Passage, ActivityStates } from '../model';
import { Schema, RecordIdentity } from '@orbit/data';
import Memory from '@orbit/memory';
import { remoteIdNum } from '../utils';
import { AddPassage } from '../utils/UpdatePassageState';

interface IProps {
  sequencenum: number;
  reference: string;
  section: RecordIdentity;
  schema: Schema;
  memory: Memory;
  book?: string;
  title?: string;
  user: string;
}

export const saveNewPassage = async (props: IProps) => {
  const {
    sequencenum,
    reference,
    section,
    schema,
    memory,
    book,
    title,
    user,
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
  schema.initializeRecord(passage);
  await memory.update(
    AddPassage(passage, section, remoteIdNum('user', user, memory.keyMap))
  );
  return passage;
};
