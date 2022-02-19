import { TransformBuilder } from '@orbit/data';
import { useGlobal } from 'reactn';
import { findRecord, related } from '.';
import { MediaFile } from '../model';
import { AddRecord } from '../model/baseModel';
import { currentDateTime } from '../utils';
import { useMediaAttach } from './useMediaAttach';
import * as actions from '../store';

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
    artifactTypeId: string,
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
    const t = new TransformBuilder();
    await memory.update([
      ...AddRecord(t, newMediaRec, user, memory),
      t.replaceRelatedRecord(newMediaRec, 'plan', {
        type: 'plan',
        id: plan || data.planId,
      }),
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
        t.replaceRelatedRecord(newMediaRec, 'artifactType', {
          type: 'artifacttype',
          id: artifactTypeId,
        }),
      ]);
    if (sourceMediaId)
      await memory.update([
        t.replaceRelatedRecord(newMediaRec, 'sourceMedia', {
          type: 'mediafile',
          id: sourceMediaId,
        }),
      ]);
    if (recordedbyUserId)
      await memory.update([
        t.replaceRelatedRecord(newMediaRec, 'recordedbyUser', {
          type: 'user',
          id: recordedbyUserId,
        }),
      ]);
    return newMediaRec;
  };
  return { createMedia };
};
