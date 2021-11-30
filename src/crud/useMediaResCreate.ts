import { useMemo } from 'react';
import { useGlobal } from 'reactn';
import { QueryBuilder, RecordIdentity, TransformBuilder } from '@orbit/data';
import { Resource, MediaFile, ArtifactType } from '../model';
import { AddRecord } from '../model/baseModel';
import { useStepId } from '.';

export const useMediaResCreate = (passage: RecordIdentity) => {
  const [memory] = useGlobal('memory');
  const [user] = useGlobal('user');
  const [plan] = useGlobal('plan');
  const internalization = useStepId('Internalization');

  const sharedResource = useMemo(() => {
    const artifactTypes = memory.cache.query((q: QueryBuilder) =>
      q.findRecords('artifacttype')
    ) as ArtifactType[];
    return artifactTypes.find(
      (t) => t.attributes?.typename === 'sharedresource'
    );
  }, [memory.cache]);

  const planRecId = { type: 'plan', id: plan };

  return async (res: Resource, artifactCategory?: RecordIdentity) => {
    const attr = res.attributes;
    const mediaRec = {
      type: 'mediafile',
      attributes: {
        versionNumber: attr.versionNumber,
        eafUrl: null,
        duration: attr.duration,
        contentType: attr.contentType,
        audioQuality: null,
        textQuality: null,
        transcription: attr.transcription,
        originalFile: attr.originalFile,
        filesize: attr.filesize,
        position: 0,
        segments: '{}',
        languagebcp47: attr.languagebcp47,
        performedBy: null,
        resourcePassageId: attr.passageId,
      },
    } as any as MediaFile;
    memory.schema.initializeRecord(mediaRec);
    const t = new TransformBuilder();
    const ops = [
      ...AddRecord(t, mediaRec, user, memory),

      t.replaceRelatedRecord(mediaRec, 'plan', planRecId),
      t.replaceRelatedRecord(mediaRec, 'passage', passage),
    ];
    if (sharedResource)
      ops.push(
        t.replaceRelatedRecord(mediaRec, 'artifactType', sharedResource)
      );
    if (artifactCategory)
      ops.push(
        t.replaceRelatedRecord(mediaRec, 'artifactCategory', artifactCategory)
      );
    if (internalization)
      ops.push(
        t.replaceRelatedRecord(mediaRec, 'orgWorkflowStep', internalization)
      );
    await memory.update(ops);
    return mediaRec;
  };
};
