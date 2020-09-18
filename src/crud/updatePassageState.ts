import { TransformBuilder, Operation, RecordIdentity } from '@orbit/data';
import Memory from '@orbit/memory';
import { PassageStateChange, ActivityStates, Passage } from '../model';
import { AddRecord } from '../model/baseModel';
import { currentDateTime } from '../utils/currentDateTime';

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
  ops.push(
    t.replaceRelatedRecord({ type: 'passage', id: rec.id }, 'section', section)
  );
  /* we don't need to do this, because the only time we call this is when
  we've just created the plan and section
  ops.push(
    t.replaceAttribute(
      { type: 'section', id: section.id },
      'dateUpdated',
      currentDateTime()
    )
  );
  ops.push(
    t.replaceAttribute(
      { type: 'plan', id: planid },
      'dateUpdated',
      currentDateTime()
    )
  ); */
  AddPassageStateChangeToOps(
    t,
    ops,
    rec.id,
    ActivityStates.TranscribeReady,
    '',
    user,
    memory
  );
  ops.push(
    t.replaceRelatedRecord(media, 'passage', { type: 'passage', id: rec.id })
  );
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
  ops.push(
    t.replaceAttribute(
      { type: 'section', id: section },
      'dateUpdated',
      currentDateTime()
    )
  );
  ops.push(
    t.replaceAttribute(
      { type: 'plan', id: plan },
      'dateUpdated',
      currentDateTime()
    )
  );
  AddPassageStateChangeToOps(t, ops, passage, state, comment, userid, memory);
  return ops;
};
