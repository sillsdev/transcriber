import { useMemo } from 'react';
import { useGlobal } from 'reactn';
import { QueryBuilder, RecordIdentity, TransformBuilder } from '@orbit/data';
import { OrgWorkflowStep, MediaFile, ArtifactType } from '../model';
import { AddRecord } from '../model/baseModel';
import { related } from '.';

export const useMediaResCreate = (passage: RecordIdentity) => {
  const [memory] = useGlobal('memory');
  const [user] = useGlobal('user');
  const [plan] = useGlobal('plan');
  const [organization] = useGlobal('organization');

  const internalization = useMemo(() => {
    const workflowsteps = memory.cache.query((q: QueryBuilder) =>
      q.findRecords('orgworkflowstep')
    ) as OrgWorkflowStep[];
    const internalizationStep = workflowsteps
      .filter((s) => related(s, 'organization') === organization)
      .find((s) => s.attributes?.name === 'Internalization');
    return internalizationStep;
  }, [memory, organization]);

  const sharedResource = useMemo(() => {
    const artifactTypes = memory.cache.query((q: QueryBuilder) =>
      q.findRecords('artifacttype')
    ) as ArtifactType[];
    return artifactTypes.find(
      (t) => t.attributes?.typename === 'sharedresource'
    );
  }, [memory]);

  const planRecId = { type: 'plan', id: plan };

  return async (mediafile: MediaFile, artifactCategory?: RecordIdentity) => {
    const attr = mediafile.attributes;
    const mediaRec = {
      type: 'mediafile',
      attributes: {
        versionNumber: attr.versionNumber,
        eafUrl: attr.eafUrl,
        audioUrl: attr.audioUrl,
        duration: attr.duration,
        contentType: attr.contentType,
        audioQuality: attr.audioQuality,
        textQuality: attr.textQuality,
        transcription: attr.transcription,
        originalFile: attr.originalFile,
        filesize: attr.filesize,
        position: 0,
        segments: attr.segments,
        languagebcp47: attr.languagebcp47,
        performedBy: attr.performedBy,
      },
    } as MediaFile;
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
