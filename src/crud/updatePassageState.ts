import { TransformBuilder, Operation, RecordIdentity } from '@orbit/data';
import Memory from '@orbit/memory';
import { PassageStateChange, ActivityStates, Passage } from '../model';
import { AddRecord, UpdateLastModifedBy } from '../model/baseModel';

const AddPassageStateChangeToOps = (
  t: TransformBuilder,
  ops: Operation[],
  passage: string,
  state: string,
  comment: string,
  userId: string,
  memory: Memory
) => {
  const psc = {
    type: 'passagestatechange',
    attributes: {
      state: state,
      comments: comment,
    },
  } as PassageStateChange;

  ops.push(...AddRecord(t, psc, userId, memory));
  const passRecId = { type: 'passage', id: passage };
  ops.push(t.replaceRelatedRecord(psc, 'passage', passRecId));
};

export const AddFlatPassage = (
  rec: Passage,
  section: RecordIdentity,
  planid: string,
  media: RecordIdentity,
  userId: string,
  memory: Memory
): Operation[] => {
  var t = new TransformBuilder();
  var ops: Operation[] = [];
  ops.push(...AddRecord(t, rec, userId, memory));
  const passRecId = { type: 'passage', id: rec.id };
  ops.push(t.replaceRelatedRecord(passRecId, 'section', section));
  AddPassageStateChangeToOps(
    t,
    ops,
    rec.id,
    ActivityStates.TranscribeReady,
    '',
    userId,
    memory
  );
  ops.push(t.replaceRelatedRecord(media, 'passage', passRecId));
  return ops;
};

export const UpdateRelatedPassageOps = (
  section: string,
  plan: string,
  userId: string,
  t: TransformBuilder,
  ops: Operation[]
) => {
  const secRecId = { type: 'section', id: section };
  ops.push(...UpdateLastModifedBy(t, secRecId, userId));
};

export const UpdatePassageStateOps = (
  passage: string,
  section: string,
  plan: string,
  state: string,
  comment: string,
  userId: string,
  t: TransformBuilder,
  ops: Operation[],
  memory: Memory,
  psc = true
): Operation[] => {
  ops.push(
    t.replaceAttribute({ type: 'passage', id: passage }, 'state', state)
  );
  const passRecId = { type: 'passage', id: passage };
  ops.push(...UpdateLastModifedBy(t, passRecId, userId));
  UpdateRelatedPassageOps(section, plan, userId, t, ops);
  if (psc)
    AddPassageStateChangeToOps(t, ops, passage, state, comment, userId, memory);
  return ops;
};
