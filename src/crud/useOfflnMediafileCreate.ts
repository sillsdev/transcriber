import { TransformBuilder } from '@orbit/data';
import { useGlobal } from 'reactn';
import { findRecord, related } from '.';
import { MediaFile } from '../model';
import { AddRecord, ReplaceRelatedRecord } from '../model/baseModel';
import { currentDateTime } from '../utils';
import { useMediaAttach } from './useMediaAttach';
import * as actions from '../store';
import path from 'path';

export const useOfflnMediafileCreate = (
  doOrbitError: typeof actions.doOrbitError
) => {
  const [memory] = useGlobal('memory');
  const [plan] = useGlobal('plan');
  const [user] = useGlobal('user');
  const [attachPassage] = useMediaAttach({
    doOrbitError,
  });
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
    await memory.update([
      ...AddRecord(t, newMediaRec, user, memory),
      ...ReplaceRelatedRecord(
        t,
        newMediaRec,
        'plan',
        'plan',
        plan || data.planId
      ),
    ]);
    if (passageId) {
      var passage = findRecord(memory, 'passage', passageId);
      attachPassage(
        passageId,
        related(passage, 'section'),
        plan,
        newMediaRec.id
      );
    }
    if (artifactTypeId)
      await memory.update([
        ...ReplaceRelatedRecord(
          t,
          newMediaRec,
          'artifactType',
          'artifacttype',
          artifactTypeId
        ),
      ]);
    if (sourceMediaId)
      await memory.update([
        ...ReplaceRelatedRecord(
          t,
          newMediaRec,
          'sourceMedia',
          'mediafile',
          sourceMediaId
        ),
      ]);
    if (recordedbyUserId)
      await memory.update([
        ...ReplaceRelatedRecord(
          t,
          newMediaRec,
          'recordedbyUser',
          'user',
          recordedbyUserId
        ),
      ]);
    return newMediaRec;
  };
  return { createMedia };
};
