import { useGlobal } from '../context/GlobalContext';
import {
  OrganizationMembershipD,
  GroupMembershipD,
  ProjectD,
  GroupD,
  OrgWorkflowStepD,
  ArtifactCategoryD,
  ArtifactTypeD,
  DiscussionD,
  CommentD,
} from '../model';
import { RecordOperation, RecordTransformBuilder } from '@orbit/records';
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
      memory?.cache.query((q) => q.findRecords('group')) as GroupD[]
    )
      .filter((g) => related(g, 'owner') === teamid)
      .map((tg) => tg.id);
    const teamgms = (
      memory?.cache.query((q) =>
        q.findRecords('groupmembership')
      ) as GroupMembershipD[]
    ).filter((gm) => teamgrpIds.includes(related(gm, 'group')));
    const teamprojs = (
      memory?.cache.query((q) => q.findRecords('project')) as ProjectD[]
    ).filter((p) => teamgrpIds.includes(related(p, 'group')));
    const projIds = teamprojs.map((p) => p.id);
    const teamoms = (
      memory?.cache.query((q) =>
        q.findRecords('organizationmembership')
      ) as OrganizationMembershipD[]
    ).filter((om) => teamgrpIds.includes(related(om, 'organization')));
    /* remove the memberships first so that refreshing happens before projects and teams disappear and causes problems */
    let ops: RecordOperation[] = [];
    const t: RecordTransformBuilder = new RecordTransformBuilder();
    teamoms.forEach((gm) => ops.push(t.removeRecord(gm).toOperation()));
    teamgms.forEach((gm) => ops.push(t.removeRecord(gm).toOperation()));
    await memory.update(ops);
    ops = [];
    for (let ix = 0; ix < projIds.length; ix++)
      await projectDelete(projIds[ix]);
    ops = [];
    const artifactcats = (
      memory?.cache.query((q) =>
        q.findRecords('artifactcategory').filter({
          relation: 'organization',
          record: { type: 'organization', id: teamid },
        })
      ) as ArtifactCategoryD[]
    ).map((c) => c.id);
    artifactcats.forEach((id) =>
      ops.push(t.removeRecord({ type: 'artifactcategory', id }).toOperation())
    );
    await memory.update(ops);
    ops = [];

    teamgrpIds.forEach((tg) =>
      ops.push(t.removeRecord({ type: 'group', id: tg }).toOperation())
    );
    if (offlineOnly) {
      const orgSteps = (
        memory?.cache.query((q) =>
          q.findRecords('orgworkflowstep').filter({
            relation: 'organization',
            record: { type: 'organization', id: teamid },
          })
        ) as OrgWorkflowStepD[]
      ).map((s) => s.id);

      const artifacttypes = (
        memory?.cache.query((q) =>
          q.findRecords('artifacttype').filter({
            relation: 'organization',
            record: { type: 'organization', id: teamid },
          })
        ) as ArtifactTypeD[]
      ).map((s) => s.id);

      const discussions = (
        memory?.cache.query((q) => q.findRecords('discussion')) as DiscussionD[]
      )
        .filter((d) => orgSteps.includes(related(d, 'orgWorkflowStep')))
        .map((s) => s.id);

      const comments = (
        memory?.cache.query((q) => q.findRecords('comment')) as CommentD[]
      )
        .filter((d) => discussions.includes(related(d, 'discussion')))
        .map((s) => s.id);

      comments.forEach((id) =>
        ops.push(t.removeRecord({ type: 'comment', id }).toOperation())
      );
      discussions.forEach((id) =>
        ops.push(t.removeRecord({ type: 'discussion', id }).toOperation())
      );
      artifacttypes.forEach((id) =>
        ops.push(t.removeRecord({ type: 'artifacttype', id }).toOperation())
      );
    }
    ops.push(
      t.removeRecord({ type: 'organization', id: teamid }).toOperation()
    );

    await memory.update(ops);
  };
};
