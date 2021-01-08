import { TransformBuilder, Operation, RecordIdentity } from '@orbit/data';
import Memory from '@orbit/memory';
import { PassageStateChange, ActivityStates, Passage } from '../model';
import { AddRecord } from '../model/baseModel';
import { currentDateTime } from '../utils';
import { remoteIdNum } from '.';

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

  const userid = remoteIdNum('user', userId, memory.keyMap);
  ops.push(AddRecord(t, psc, userid, memory));
  const passRecId = { type: 'passage', id: passage };
  ops.push(t.replaceRelatedRecord(psc, 'passage', passRecId));
  ops.push(
    t.replaceRelatedRecord(psc, 'user', {
      type: 'user',
      id: userId,
    })
  );
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
  const userRemId = remoteIdNum('user', userId, memory.keyMap);
  ops.push(AddRecord(t, rec, userRemId, memory));
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

export const UpdatePassageStateOps = (
  passage: string,
  section: string,
  plan: string,
  state: string,
  comment: string,
  userId: string,
  t: TransformBuilder,
  ops: Operation[],
  memory: Memory
): Operation[] => {
  ops.push(
    t.replaceAttribute({ type: 'passage', id: passage }, 'state', state)
  );
  const passRecId = { type: 'passage', id: passage };
  const secRecId = { type: 'section', id: section };
  const planRecId = { type: 'plan', id: plan };
  const curTime = currentDateTime();
  const userid = remoteIdNum('user', userId, memory.keyMap);
  ops.push(t.replaceAttribute(passRecId, 'dateUpdated', curTime));
  ops.push(t.replaceAttribute(passRecId, 'lastmodifiedby', userid));
  ops.push(t.replaceAttribute(secRecId, 'dateUpdated', curTime));
  ops.push(t.replaceAttribute(planRecId, 'dateUpdated', curTime));
  AddPassageStateChangeToOps(t, ops, passage, state, comment, userId, memory);
  return ops;
};
