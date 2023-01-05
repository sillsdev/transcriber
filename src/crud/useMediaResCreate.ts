import { useMemo } from 'react';
import { useGlobal } from '../mods/reactn';
import { QueryBuilder, RecordIdentity, TransformBuilder } from '@orbit/data';
import { Resource, MediaFile, ArtifactType } from '../model';
import { AddRecord, ReplaceRelatedRecord } from '../model/baseModel';

export const useMediaResCreate = (passage: RecordIdentity, stepId: string) => {
  const [memory] = useGlobal('memory');
  const [user] = useGlobal('user');
  const [plan] = useGlobal('plan');

  const sharedResource = useMemo(() => {
    const artifactTypes = memory.cache.query((q: QueryBuilder) =>
      q.findRecords('artifacttype')
    ) as ArtifactType[];
    return artifactTypes.find(
      (t) => t.attributes?.typename === 'sharedresource'
    );
  }, [memory.cache]);

  return async (res: Resource, artifactCategoryId?: string) => {
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

      ...ReplaceRelatedRecord(t, mediaRec, 'plan', 'plan', plan),
      ...ReplaceRelatedRecord(t, mediaRec, 'recordedbyUser', 'user', user),
      // shared resources are not associated with a single passage
      // ...ReplaceRelatedRecord(t, mediaRec, 'passage', 'passage', passage.id),
    ];
    if (sharedResource)
      ops.push(
        ...ReplaceRelatedRecord(
          t,
          mediaRec,
          'artifactType',
          'artifacttype',
          sharedResource.id
        )
      );
    if (artifactCategoryId)
      ops.push(
        ...ReplaceRelatedRecord(
          t,
          mediaRec,
          'artifactCategory',
          'artifactcategory',
          artifactCategoryId
        )
      );
    if (stepId)
      ops.push(
        ...ReplaceRelatedRecord(
          t,
          mediaRec,
          'orgWorkflowStep',
          'orgworkflowstep',
          stepId
        )
      );
    await memory.update(ops);
    return mediaRec;
  };
};
