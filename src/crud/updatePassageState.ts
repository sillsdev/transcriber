import Memory from '@orbit/memory';
import { findRecord, mediaFileName, related } from '.';
import {
  PassageStateChange,
  ActivityStates,
  MediaFile,
  Passage,
} from '../model';
import {
  AddRecord,
  ReplaceRelatedRecord,
  UpdateLastModifiedBy,
} from '../model/baseModel';
import {
  InitializedRecord,
  RecordIdentity,
  RecordOperation,
  RecordTransformBuilder,
} from '@orbit/records';

export const AddPassageStateChangeToOps = (
  t: RecordTransformBuilder,
  ops: RecordOperation[],
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
  ops.push(
    ...ReplaceRelatedRecord(
      t,
      psc as InitializedRecord,
      'passage',
      'passage',
      passage
    )
  );
};

export const AddFlatPassage = (
  rec: Passage,
  section: RecordIdentity,
  planid: string,
  media: RecordIdentity,
  userId: string,
  memory: Memory
): RecordOperation[] => {
  var t = new RecordTransformBuilder();
  var ops: RecordOperation[] = [];
  ops.push(...AddRecord(t, rec, userId, memory));
  ops.push(
    ...ReplaceRelatedRecord(
      t,
      rec as RecordIdentity,
      'section',
      'section',
      section.id
    )
  );
  AddPassageStateChangeToOps(
    t,
    ops,
    rec.id as string,
    ActivityStates.TranscribeReady,
    '',
    userId,
    memory
  );
  ops.push(...ReplaceRelatedRecord(t, media, 'passage', 'passage', rec.id));
  return ops;
};

export const UpdateRelatedPassageOps = (
  section: string,
  plan: string,
  userId: string,
  t: RecordTransformBuilder,
  ops: RecordOperation[]
) => {
  ops.push(
    ...UpdateLastModifiedBy(t, { type: 'section', id: section }, userId)
  );
  ops.push(...UpdateLastModifiedBy(t, { type: 'plan', id: plan }, userId));
};
export const UpdateMediaStateOps = (
  mediaFile: string,
  passage: string,
  state: string,
  userId: string,
  t: RecordTransformBuilder,
  ops: RecordOperation[],
  memory: Memory,
  comment: string
): RecordOperation[] => {
  const mediaRecId = { type: 'mediafile', id: mediaFile };
  if (state)
    ops.push(
      t.replaceAttribute(mediaRecId, 'transcriptionstate', state).toOperation()
    );
  const mediaRec = findRecord(memory, 'mediafile', mediaFile) as MediaFile;
  const isVernacular = !related(mediaRec, 'artifacttype');
  ops.push(...UpdateLastModifiedBy(t, mediaRecId, userId));
  AddPassageStateChangeToOps(
    t,
    ops,
    passage,
    isVernacular && state ? state : '',
    mediaFileName(mediaRec) + (comment ? ':' + comment : ''),
    userId,
    memory
  );
  return ops;
};
