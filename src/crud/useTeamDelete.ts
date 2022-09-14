import { useGlobal } from 'reactn';
import {
  ArtifactCategory,
  ArtifactType,
  Discussion,
  Group,
  GroupMembership,
  OrganizationMembership,
  OrgWorkflowStep,
  Project,
  Comment,
} from '../model';
import { Operation, QueryBuilder, TransformBuilder } from '@orbit/data';
import { related, findRecord } from '.';
import { useProjectDelete } from './useProjectDelete';
export const useTeamDelete = () => {
  const [memory] = useGlobal('memory');
  const [offlineOnly] = useGlobal('offlineOnly');
  const projectDelete = useProjectDelete();

  const noTeam = (teamId: string) =>
    !teamId || !findRecord(memory, 'organization', teamId);

  return async (teamid: string) => {
    if (noTeam(teamid)) return;
    const teamgrpIds = (
      memory.cache.query((q: QueryBuilder) => q.findRecords('group')) as Group[]
    )
      .filter((g) => related(g, 'owner') === teamid)
      .map((tg) => tg.id);
    const teamgms = (
      memory.cache.query((q: QueryBuilder) =>
        q.findRecords('groupmembership')
      ) as GroupMembership[]
    ).filter((gm) => teamgrpIds.includes(related(gm, 'group')));
    const teamprojs = (
      memory.cache.query((q: QueryBuilder) =>
        q.findRecords('project')
      ) as Project[]
    ).filter((p) => teamgrpIds.includes(related(p, 'group')));
    const projIds = teamprojs.map((p) => p.id);
    const teamoms = (
      memory.cache.query((q: QueryBuilder) =>
        q.findRecords('organizationmembership')
      ) as OrganizationMembership[]
    ).filter((om) => teamgrpIds.includes(related(om, 'organization')));
    /* remove the memberships first so that refreshing happens before projects and teams disappear and causes problems */
    let ops: Operation[] = [];
    const t: TransformBuilder = new TransformBuilder();
    teamoms.forEach((gm) => ops.push(t.removeRecord(gm)));
    teamgms.forEach((gm) => ops.push(t.removeRecord(gm)));
    await memory.update(ops);
    ops = [];
    for (let ix = 0; ix < projIds.length; ix++)
      await projectDelete(projIds[ix]);
    ops = [];
    teamgrpIds.forEach((tg) =>
      ops.push(t.removeRecord({ type: 'group', id: tg }))
    );
    if (offlineOnly) {
      const orgSteps = (
        memory.cache.query((q: QueryBuilder) =>
          q.findRecords('orgworkflowstep').filter({
            relation: 'organization',
            record: { type: 'organization', id: teamid },
          })
        ) as OrgWorkflowStep[]
      ).map((s) => s.id);

      const artifactcats = (
        memory.cache.query((q: QueryBuilder) =>
          q.findRecords('artifactcategory').filter({
            relation: 'organization',
            record: { type: 'organization', id: teamid },
          })
        ) as ArtifactCategory[]
      ).map((c) => c.id);
      const artifacttypes = (
        memory.cache.query((q: QueryBuilder) =>
          q.findRecords('artifacttype').filter({
            relation: 'organization',
            record: { type: 'organization', id: teamid },
          })
        ) as ArtifactType[]
      ).map((s) => s.id);

      const discussions = (
        memory.cache.query((q: QueryBuilder) =>
          q.findRecords('discussion')
        ) as Discussion[]
      )
        .filter((d) => orgSteps.includes(related(d, 'orgWorkflowStep')))
        .map((s) => s.id);

      const comments = (
        memory.cache.query((q: QueryBuilder) =>
          q.findRecords('comment')
        ) as Comment[]
      )
        .filter((d) => discussions.includes(related(d, 'discussion')))
        .map((s) => s.id);

      comments.forEach((id) =>
        ops.push(t.removeRecord({ type: 'comment', id }))
      );
      discussions.forEach((id) =>
        ops.push(t.removeRecord({ type: 'discussion', id }))
      );

      artifacttypes.forEach((id) =>
        ops.push(t.removeRecord({ type: 'artifacttype', id }))
      );
      artifactcats.forEach((id) =>
        ops.push(t.removeRecord({ type: 'artifactcategory', id }))
      );
    }
    ops.push(t.removeRecord({ type: 'organization', id: teamid }));

    await memory.update(ops);
  };
};
