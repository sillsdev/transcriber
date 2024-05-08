import { RecordOperation, RecordTransformBuilder } from '@orbit/records';
import { useGlobal } from 'reactn';
import { MediaFile, MediaFileD } from '../model';
import { AddRecord, ReplaceRelatedRecord } from '../model/baseModel';
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
        versionNumber: version,
        eafUrl: data.eafUrl || '',
        audioUrl: data.audioUrl || '',
        s3file: data.s3file || '',
        duration: data.duration || 0,
        contentType: data.contentType || '',
        audioQuality: data.audioQuality || '',
        textQuality: data.textQuality || '',
        transcription: '',
        originalFile: data.originalFile || '',
        filesize: size,
        position: 0,
        segments: data.segments || '{}',
        languagebcp47: data.languagebcp47 || '',
        link: data.link || false,
        readyToShare: false,
        performedBy: data.performedBy || '',
        sourceSegments: data.sourceSegments || '{}',
        sourceMediaOfflineId: '',
        transcriptionstate: data.transcriptionstate || '',
        topic: data.topic || '',
        lastModifiedBy: -1,
        resourcePassageId: -1,
        offlineId: '',
      },
    } as MediaFile;
    //check new comment version
    if (path.basename(data.audioUrl) !== data.originalFile) {
      newMediaRec.attributes.originalFile = path.basename(data.audioUrl);
    }
    const t = new RecordTransformBuilder();
    const ops: RecordOperation[] = [];
    ops.push(...AddRecord(t, newMediaRec, user, memory));
    ops.push(
      ...ReplaceRelatedRecord(
        t,
        newMediaRec as MediaFileD,
        'plan',
        'plan',
        plan || data.planId
      )
    );
    if (passageId)
      ops.push(
        ...ReplaceRelatedRecord(
          t,
          newMediaRec as MediaFileD,
          'passage',
          'passage',
          passageId
        )
      );
    if (artifactTypeId)
      ops.push(
        ...ReplaceRelatedRecord(
          t,
          newMediaRec as MediaFileD,
          'artifactType',
          'artifacttype',
          artifactTypeId
        )
      );
    if (sourceMediaId)
      ops.push(
        ...ReplaceRelatedRecord(
          t,
          newMediaRec as MediaFileD,
          'sourceMedia',
          'mediafile',
          sourceMediaId
        )
      );
    if (recordedbyUserId)
      ops.push(
        ...ReplaceRelatedRecord(
          t,
          newMediaRec as MediaFileD,
          'recordedbyUser',
          'user',
          recordedbyUserId
        )
      );
    await memory.update(ops);

    return newMediaRec as MediaFileD;
  };
  return { createMedia };
};
