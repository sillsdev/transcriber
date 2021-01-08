import { TransformBuilder, Operation, RecordIdentity } from '@orbit/data';
import Memory from '@orbit/memory';
import { PassageStateChange, ActivityStates, Passage } from '../model';
import { AddRecord } from '../model/baseModel';
import { currentDateTime } from '../utils';
import { remoteIdGuid } from '.';

const AddPassageStateChangeToOps = (
  t: TransformBuilder,
  ops: Operation[],
  passage: string,
  state: string,
  comment: string,
  userid: number,
  memory: Memory
) => {
  const psc = {
    type: 'passagestatechange',
    attributes: {
      state: state,
      comments: comment,
    },
  } as PassageStateChange;

  ops.push(AddRecord(t, psc, userid, memory));
  const passRecId = { type: 'passage', id: passage };
  ops.push(t.replaceRelatedRecord(psc, 'passage', passRecId));
  ops.push(
    t.replaceRelatedRecord(psc, 'user', {
      type: 'user',
      id: remoteIdGuid('user', userid.toString(), memory.keyMap),
    })
  );
};

export const AddFlatPassage = (
  rec: Passage,
  section: RecordIdentity,
  planid: string,
  media: RecordIdentity,
  user: number,
  memory: Memory
): Operation[] => {
  var t = new TransformBuilder();
  var ops: Operation[] = [];
  ops.push(AddRecord(t, rec, user, memory));
  const passRecId = { type: 'passage', id: rec.id };
  ops.push(t.replaceRelatedRecord(passRecId, 'section', section));
  AddPassageStateChangeToOps(
    t,
    ops,
    rec.id,
    ActivityStates.TranscribeReady,
    '',
    user,
    memory
  );
  ops.push(t.replaceRelatedRecord(media, 'passage', passRecId));
  return ops;
};

export const AddPassageStateCommentOps = (
  passage: string,
  state: string,
  comment: string,
  userid: number,
  t: TransformBuilder,
  ops: Operation[],
  memory: Memory
): Operation[] => {
  AddPassageStateChangeToOps(t, ops, passage, state, comment, userid, memory);
  return ops;
};

export const UpdatePassageStateOps = (
  passage: string,
  section: string,
  plan: string,
  state: string,
  comment: string,
  userid: number,
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
  ops.push(t.replaceAttribute(passRecId, 'dateUpdated', curTime));
  ops.push(t.replaceAttribute(passRecId, 'lastmodifiedby', userid));
  ops.push(t.replaceAttribute(secRecId, 'dateUpdated', curTime));
  ops.push(t.replaceAttribute(planRecId, 'dateUpdated', curTime));
  AddPassageStateChangeToOps(t, ops, passage, state, comment, userid, memory);
  return ops;
};
