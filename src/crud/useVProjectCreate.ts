import { useGlobal } from 'reactn';
import { VProject, Project, Plan, Group } from '../model';
import { TransformBuilder, QueryBuilder } from '@orbit/data';
import { related, useTypeId, useOfflnProjCreate } from '.';
import { useProjectsLoaded, localeDefault, currentDateTime } from '../utils';

export const useVProjectCreate = () => {
  const [memory] = useGlobal('memory');
  const [user] = useGlobal('user');
  const [isDeveloper] = useGlobal('developer');
  const offlineProjectCreate = useOfflnProjCreate();

  const AddProjectLoaded = useProjectsLoaded();
  const getTypeId = useTypeId();

  const getGroupId = (teamId: string) => {
    const grpRecs = memory.cache.query((q: QueryBuilder) =>
      q.findRecords('group')
    ) as Group[];
    const selected = grpRecs.filter((g) => related(g, 'owner') === teamId);
    return selected.length > 0 ? selected[0].id : '';
  };

  return async (vProject: VProject, teamId: string) => {
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
        uilanguagebcp47: localeDefault(isDeveloper),
        language,
        languageName,
        defaultFont,
        defaultFontSize,
        rtl,
        spellCheck: false,
        allowClaim: true,
        isPublic: true,
        dateCreated: currentDateTime(),
        dateUpdated: currentDateTime(),
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
        id: getGroupId(teamId),
      }),
      t.replaceRelatedRecord(project, 'organization', {
        type: 'organization',
        id: teamId,
      }),
      t.replaceRelatedRecord(project, 'owner', {
        type: 'user',
        id: user,
      }),
    ]);
    await offlineProjectCreate(project);
    AddProjectLoaded(project.id);

    let plan: Plan = {
      type: 'plan',
      attributes: {
        name,
        flat,
        tags: JSON.stringify(tags),
        organizedBy,
        dateCreated: currentDateTime(),
        dateUpdated: currentDateTime(),
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

    return plan.id;
  };
};
