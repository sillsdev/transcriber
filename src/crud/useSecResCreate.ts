import { useMemo } from 'react';
import { useGlobal } from '../mods/reactn';
import { QueryBuilder, RecordIdentity, TransformBuilder } from '@orbit/data';
import { SectionResource, OrgWorkflowStep } from '../model';
import { AddRecord, ReplaceRelatedRecord } from '../model/baseModel';
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
    memory.schema.initializeRecord(secRes);
    const t = new TransformBuilder();
    const ops = [
      ...AddRecord(t, secRes, user, memory),
      ...ReplaceRelatedRecord(
        t,
        secRes,
        'section',
        'section',
        secId || section.id
      ),
      ...ReplaceRelatedRecord(
        t,
        secRes,
        'mediafile',
        'mediafile',
        mediafile.id
      ),
      ...ReplaceRelatedRecord(
        t,
        secRes,
        'orgWorkflowStep',
        'orgworkflowstep',
        internalization?.id
      ),
    ];
    if (passId) {
      ops.push(
        ...ReplaceRelatedRecord(t, secRes, 'passage', 'passage', passId)
      );
    }
    await memory.update(ops);
  };
};
