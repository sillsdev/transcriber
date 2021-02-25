import { useGlobal } from 'reactn';
import { Group, GroupMembership, Organization, OrganizationMembership, Project } from '../model';
import { Operation, QueryBuilder, TransformBuilder } from '@orbit/data';
import { related,  } from '.';
import { useOfflnProjDelete } from './useOfflnProjDelete';
export const useTeamDelete = () => {
  const [memory] = useGlobal('memory');
  const [projectsLoaded, setProjectsLoaded] = useGlobal('projectsLoaded');
  const offlineDelete = useOfflnProjDelete();

   return async (team: Organization) => {
    const teamgrpIds = (memory.cache.query((q: QueryBuilder) => q.findRecords('group')) as Group[]).filter(g => related(g, 'owner') === team.id).map(tg => tg.id);
    const teamgms = (memory.cache.query((q: QueryBuilder) =>
    q.findRecords('groupmembership')) as GroupMembership[]).filter((gm) => teamgrpIds.includes(related(gm, 'group')));
    const teamprojs = (memory.cache.query((q: QueryBuilder) =>
    q.findRecords('project')) as Project[]).filter(p => teamgrpIds.includes(related(p, 'group')));
    const projIds = teamprojs.map(p => p.id);
    const teamoms = (memory.cache.query((q: QueryBuilder) =>
    q.findRecords('organizationmembership')) as OrganizationMembership[]).filter((om) => teamgrpIds.includes(related(om, 'organization')));
    /* remove the memberships first so that refreshing happens before projects and teams disappear and causes problems */
    var ops: Operation[] = [];
    const t: TransformBuilder = new TransformBuilder();
    teamoms.forEach(gm => ops.push(t.removeRecord(gm)));
    teamgms.forEach(gm => ops.push(t.removeRecord(gm)));
    await memory.update(ops);
    ops = [];
    teamprojs.forEach(tp => ops.push(t.removeRecord(tp)));
    teamgrpIds.forEach(tg => ops.push(t.removeRecord({type: 'group', id: tg})));
    ops.push(t.removeRecord(team));
    for (var ix = 0; ix < projIds.length; ix++)
      await offlineDelete(projIds[ix]);
    await memory.update(ops);
    setProjectsLoaded(projectsLoaded.filter(p => !projIds.includes(p)));
  };
};
