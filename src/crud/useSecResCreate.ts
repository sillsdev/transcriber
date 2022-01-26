import { useMemo } from 'react';
import { useGlobal } from 'reactn';
import { QueryBuilder, RecordIdentity, TransformBuilder } from '@orbit/data';
import { SectionResource, OrgWorkflowStep } from '../model';
import { AddRecord } from '../model/baseModel';
import { getTool, related, ToolSlug } from '.';

export const useSecResCreate = (section: RecordIdentity) => {
  const [memory] = useGlobal('memory');
  const [user] = useGlobal('user');
  const [organization] = useGlobal('organization');
  const [offlineOnly] = useGlobal('offlineOnly');
  const internalization = useMemo(() => {
    const workflowsteps = memory.cache.query((q: QueryBuilder) =>
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
    mediafile: RecordIdentity
  ) => {
    const secRes = {
      type: 'sectionresource',
      attributes: {
        sequenceNum: seq,
        description: desc,
      },
    } as SectionResource;
    memory.schema.initializeRecord(secRes);
    const t = new TransformBuilder();
    const ops = [
      ...AddRecord(t, secRes, user, memory),
      t.replaceRelatedRecord(secRes, 'section', section),
      t.replaceRelatedRecord(secRes, 'mediafile', mediafile),
    ];
    if (internalization)
      ops.push(
        t.replaceRelatedRecord(secRes, 'orgWorkflowStep', internalization)
      );
    await memory.update(ops);
  };
};
