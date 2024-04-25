import { useGlobal } from 'reactn';
import { RecordIdentity, RecordTransformBuilder } from '@orbit/records';
import { Resource, MediaFile, MediaFileD } from '../model';
import { AddRecord, ReplaceRelatedRecord } from '../model/baseModel';
import { ArtifactTypeSlug, useArtifactType } from '.';

export const useMediaResCreate = (passage: RecordIdentity, stepId: string) => {
  const [memory] = useGlobal('memory');
  const [user] = useGlobal('user');
  const [plan] = useGlobal('plan');
  const { getTypeId } = useArtifactType();

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
    const t = new RecordTransformBuilder();
    const ops = [
      ...AddRecord(t, mediaRec, user, memory),
      ...ReplaceRelatedRecord(
        t,
        mediaRec as RecordIdentity,
        'plan',
        'plan',
        plan
      ),
      ...ReplaceRelatedRecord(
        t,
        mediaRec as RecordIdentity,
        'recordedbyUser',
        'user',
        user
      ),
      // shared resources are not associated with a single passage
      // ...ReplaceRelatedRecord(t, mediaRec, 'passage', 'passage', passage.id),
    ];
    ops.push(
      ...ReplaceRelatedRecord(
        t,
        mediaRec as RecordIdentity,
        'artifactType',
        'artifacttype',
        getTypeId(ArtifactTypeSlug.SharedResource)
      )
    );
    if (artifactCategoryId)
      ops.push(
        ...ReplaceRelatedRecord(
          t,
          mediaRec as RecordIdentity,
          'artifactCategory',
          'artifactcategory',
          artifactCategoryId
        )
      );
    if (stepId)
      ops.push(
        ...ReplaceRelatedRecord(
          t,
          mediaRec as RecordIdentity,
          'orgWorkflowStep',
          'orgworkflowstep',
          stepId
        )
      );
    await memory.update(ops);
    return mediaRec as MediaFileD;
  };
};
