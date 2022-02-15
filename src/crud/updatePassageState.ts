import { TransformBuilder, Operation, RecordIdentity } from '@orbit/data';
import Memory from '@orbit/memory';
import { findRecord, related } from '.';
import {
  PassageStateChange,
  ActivityStates,
  Passage,
  MediaFile,
} from '../model';
import { AddRecord, UpdateLastModifedBy } from '../model/baseModel';

export const AddPassageStateChangeToOps = (
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
  ops.push(...UpdateLastModifedBy(t, { type: 'section', id: section }, userId));
  ops.push(...UpdateLastModifedBy(t, { type: 'plan', id: plan }, userId));
};
export const UpdateMediaStateOps = (
  mediaFile: string,
  passage: string,
  state: string,
  userId: string,
  t: TransformBuilder,
  ops: Operation[],
  memory: Memory,
  comment: string
): Operation[] => {
  const mediaRecId = { type: 'mediafile', id: mediaFile };
  if (state)
    ops.push(t.replaceAttribute(mediaRecId, 'transcriptionstate', state));
  const mediaRec = findRecord(memory, 'mediafile', mediaFile) as MediaFile;
  const isVernacular = !related(mediaRec, 'artifacttype');
  ops.push(...UpdateLastModifedBy(t, mediaRecId, userId));
  AddPassageStateChangeToOps(
    t,
    ops,
    passage,
    isVernacular && state ? state : '',
    mediaRec.attributes.originalFile + (comment ? ':' + comment : ''),
    userId,
    memory
  );
  return ops;
};
