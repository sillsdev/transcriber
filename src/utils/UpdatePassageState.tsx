import { TransformBuilder, Operation } from '@orbit/data';
import { PassageStateChange, ActivityStates, Passage } from '../model';
import { AddRecord } from '../model/baseModel';
import { currentDateTime } from './currentDateTime';

const AddPassageStateChangeToOps = (
  t: TransformBuilder,
  ops: Operation[],
  passage: string,
  state: string,
  comment: string,
  userid: number
) => {
  const psc = {
    type: 'passagestatechange',
    attributes: {
      state: state,
      comments: comment,
    },
  } as PassageStateChange;

  ops.push(AddRecord(t, psc, userid));
  console.log(psc, passage, state, comment);
  ops.push(
    t.replaceRelatedRecord(
      { type: 'passagestatechange', id: psc.id },
      'passage',
      {
        type: 'passage',
        id: passage,
      }
    )
  );
};

export const AddPassage = (rec: Passage, user: number): Operation[] => {
  var t = new TransformBuilder();
  var ops: Operation[] = [];
  ops.push(AddRecord(t, rec, user));
  AddPassageStateChangeToOps(t, ops, rec.id, ActivityStates.NoMedia, '', user);
  return ops;
};

export const AddPassageStateCommentOps = (
  passage: string,
  state: string,
  comment: string,
  userid: number,
  t: TransformBuilder,
  ops: Operation[]
): Operation[] => {
  AddPassageStateChangeToOps(t, ops, passage, state, comment, userid);
  return ops;
};

export const UpdatePassageStateOps = (
  passage: string,
  state: string,
  comment: string,
  userid: number,
  t: TransformBuilder,
  ops: Operation[]
): Operation[] => {
  ops.push(
    t.replaceAttribute({ type: 'passage', id: passage }, 'state', state)
  );
  ops.push(
    t.replaceAttribute(
      { type: 'passage', id: passage },
      'dateUpdated',
      currentDateTime()
    )
  );
  ops.push(
    t.replaceAttribute(
      { type: 'passage', id: passage },
      'lastmodifiedby',
      userid
    )
  );
  AddPassageStateChangeToOps(t, ops, passage, state, comment, userid);
  return ops;
};
