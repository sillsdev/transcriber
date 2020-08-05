import { useGlobal } from 'reactn';
import { VProject, Project, Plan, Organization, Group } from '../model';
import { TransformBuilder, QueryBuilder } from '@orbit/data';
import { related, localeDefault } from '../utils';
import { useTypeId } from '.';

export const useVProjectCreate = () => {
  const [memory] = useGlobal('memory');
  const [user] = useGlobal('user');
  const getTypeId = useTypeId();

  const getGroupId = (team: Organization) => {
    const grpRecs = memory.cache.query((q: QueryBuilder) =>
      q.findRecords('group')
    ) as Group[];
    const selected = grpRecs.filter((g) => related(g, 'owner') === team.id);
    return selected.length > 0 ? selected[0].id : '';
  };

  return async (vProject: VProject, team: Organization) => {
    const {
      name,
      description,
      type,
      language,
      languageName,
      defaultFont,
      defaultFontSize,
      rtl,
      flat,
      tags,
      organizedBy,
    } = vProject.attributes;

    let project: Project = {
      type: 'project',
      attributes: {
        name,
        description,
        uilanguagebcp47: localeDefault(),
        language,
        languageName,
        defaultFont,
        defaultFontSize,
        rtl,
        allowClaim: true,
        isPublic: true,
      },
    } as Project;
    memory.schema.initializeRecord(project);
    await memory.update((t: TransformBuilder) => [
      t.addRecord(project),
      // We use the plan type and not the project type
      t.replaceRelatedRecord(project, 'projecttype', {
        type: 'projecttype',
        id: getTypeId(
          type.toLowerCase() === 'scripture' ? type : 'generic',
          'project'
        ),
      }),
      t.replaceRelatedRecord(project, 'group', {
        type: 'group',
        id: getGroupId(team),
      }),
      t.replaceRelatedRecord(project, 'organization', {
        type: 'organization',
        id: team.id,
      }),
      t.replaceRelatedRecord(project, 'owner', {
        type: 'user',
        id: user,
      }),
    ]);

    let plan: Plan = {
      type: 'plan',
      attributes: {
        name,
        flat,
        tags: JSON.stringify(tags),
        organizedBy,
      },
    } as any;
    memory.schema.initializeRecord(plan);
    await memory.update((t: TransformBuilder) => [
      t.addRecord(plan),
      t.replaceRelatedRecord(plan, 'plantype', {
        type: 'plantype',
        id: getTypeId(type, 'plan'),
      }),
      t.replaceRelatedRecord(plan, 'project', {
        type: 'project',
        id: project.id,
      }),
    ]);
  };
};
