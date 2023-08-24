import { Operation, TransformBuilder } from '@orbit/data';
import { useGlobal } from 'reactn';
import { MediaFile } from '../model';
import { AddRecord, ReplaceRelatedRecord } from '../model/baseModel';
import { currentDateTime } from '../utils';
import path from 'path-browserify';

export const useOfflnMediafileCreate = () => {
  const [memory] = useGlobal('memory');
  const [plan] = useGlobal('plan');
  const [user] = useGlobal('user');
  const createMedia = async (
    data: any, //from upload
    version: number,
    size: number,
    passageId: string,
    artifactTypeId: string | null,
    sourceMediaId: string,
    recordedbyUserId: string
  ) => {
    const newMediaRec: MediaFile = {
      type: 'mediafile',
      attributes: {
        ...data,
        versionNumber: version,
        transcription: '',
        filesize: size,
        position: 0,
        dateCreated: currentDateTime(),
        dateUpdated: currentDateTime(),
      },
    } as any;
    //check new comment version
    if (path.basename(data.audioUrl) !== data.originalFile) {
      newMediaRec.attributes.originalFile = path.basename(data.audioUrl);
    }
    const t = new TransformBuilder();
    const ops: Operation[] = [];
    ops.push(...AddRecord(t, newMediaRec, user, memory));
    ops.push(
      ...ReplaceRelatedRecord(
        t,
        newMediaRec,
        'plan',
        'plan',
        plan || data.planId
      )
    );
    if (passageId)
      ops.push(
        ...ReplaceRelatedRecord(t, newMediaRec, 'passage', 'passage', passageId)
      );
    if (artifactTypeId)
      ops.push(
        ...ReplaceRelatedRecord(
          t,
          newMediaRec,
          'artifactType',
          'artifacttype',
          artifactTypeId
        )
      );
    if (sourceMediaId)
      ops.push(
        ...ReplaceRelatedRecord(
          t,
          newMediaRec,
          'sourceMedia',
          'mediafile',
          sourceMediaId
        )
      );
    if (recordedbyUserId)
      ops.push(
        ...ReplaceRelatedRecord(
          t,
          newMediaRec,
          'recordedbyUser',
          'user',
          recordedbyUserId
        )
      );
    await memory.update(ops);

    return newMediaRec;
  };
  return { createMedia };
};
