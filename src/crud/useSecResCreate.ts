import { useMemo } from 'react';
import { useGlobal } from 'reactn';
import { RecordIdentity, RecordTransformBuilder } from '@orbit/records';
import { SectionResource, OrgWorkflowStep } from '../model';
import { AddRecord, ReplaceRelatedRecord } from '../model/baseModel';
import { getTool, related, ToolSlug } from '.';

export const useSecResCreate = (section: RecordIdentity) => {
  const [memory] = useGlobal('memory');
  const [user] = useGlobal('user');
  const [organization] = useGlobal('organization');
  const [offlineOnly] = useGlobal('offlineOnly');
  const internalization = useMemo(() => {
    const workflowsteps = memory.cache.query((q) =>
      q.findRecords('orgworkflowstep')
    ) as OrgWorkflowStep[];
    const internalizationStep = workflowsteps
      .filter((s) => related(s, 'organization') === organization)
      .find(
        (s) =>
          getTool(s.attributes?.tool) === ToolSlug.Resource &&
          Boolean(s?.keys?.remoteId) === !offlineOnly
      );
    return internalizationStep;
  }, [memory.cache, organization, offlineOnly]);

  return async (
    seq: number,
    desc: string | null,
    mediafile: RecordIdentity,
    passId?: string | null,
    secId?: string
  ) => {
    const secRes = {
      type: 'sectionresource',
      attributes: {
        sequenceNum: seq,
        description: desc,
      },
    } as SectionResource;
    const t = new RecordTransformBuilder();
    const ops = [
      ...AddRecord(t, secRes, user, memory),
      ...ReplaceRelatedRecord(
        t,
        secRes as RecordIdentity,
        'section',
        'section',
        secId || section.id
      ),
      ...ReplaceRelatedRecord(
        t,
        secRes as RecordIdentity,
        'mediafile',
        'mediafile',
        mediafile.id
      ),
      ...ReplaceRelatedRecord(
        t,
        secRes as RecordIdentity,
        'orgWorkflowStep',
        'orgworkflowstep',
        internalization?.id
      ),
    ];
    if (passId) {
      ops.push(
        ...ReplaceRelatedRecord(
          t,
          secRes as RecordIdentity,
          'passage',
          'passage',
          passId
        )
      );
    }
    await memory.update(ops);
  };
};
