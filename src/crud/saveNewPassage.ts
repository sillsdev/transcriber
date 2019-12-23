import { Passage, PassageSection, ActivityStates } from '../model';
import { TransformBuilder, Schema, RecordIdentity } from '@orbit/data';
import Memory from '@orbit/memory';

interface IProps {
  sequencenum: number;
  reference: string;
  section: RecordIdentity;
  schema: Schema;
  memory: Memory;
  book?: string;
  title?: string;
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
  const passageSection: PassageSection = {
    type: 'passagesection',
    attributes: {
      sectionId: 0,
      passageId: 0,
    },
  } as any;
  await memory.update((t: TransformBuilder) => [t.addRecord(passage)]);
  await memory.update((t: TransformBuilder) => [
    t.addRecord(passageSection),
    t.replaceRelatedRecord(passageSection, 'section', section),
    t.replaceRelatedRecord(passageSection, 'passage', passage),
  ]);
  return passage;
};
