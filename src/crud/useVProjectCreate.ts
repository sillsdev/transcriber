import { useGlobal } from 'reactn';
import { VProject, Project, Plan, Group } from '../model';
import { TransformBuilder, QueryBuilder } from '@orbit/data';
import { related, useTypeId, useOfflnProjCreate } from '.';
import { useProjectsLoaded, localeDefault, currentDateTime } from '../utils';
import JSONAPISource from '@orbit/jsonapi';
import { AddRecord, ReplaceRelatedRecord } from '../model/baseModel';

export const useVProjectCreate = () => {
  const [memory] = useGlobal('memory');
  const [coordinator] = useGlobal('coordinator');
  const [user] = useGlobal('user');
  const [isDeveloper] = useGlobal('developer');
  const [offlineOnly] = useGlobal('offlineOnly');

  const offlineProjectCreate = useOfflnProjCreate();

  const AddProjectLoaded = useProjectsLoaded();
  const getTypeId = useTypeId();

  const getGroupId = (teamId: string) => {
    const grpRecs = memory.cache.query((q: QueryBuilder) =>
      q.findRecords('group')
    ) as Group[];
    const selected = grpRecs.filter(
      (g) => g.attributes.allUsers && related(g, 'owner') === teamId
    );
    return selected.length > 0 ? selected[0].id : '';
  };

  return async (vProject: VProject, teamId: string) => {
    const {
      name,
      description,
      type,
      language,
      languageName,
      isPublic,
      spellCheck,
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
        isPublic,
        spellCheck,
        defaultFont,
        defaultFontSize,
        rtl,
        allowClaim: true,
        dateCreated: currentDateTime(),
        dateUpdated: currentDateTime(),
      },
    } as Project;
    memory.schema.initializeRecord(project);
    await memory.update((t: TransformBuilder) => [
      t.addRecord(project),
      // We use the plan type and not the project type
      ...ReplaceRelatedRecord(
        t,
        project,
        'projecttype',
        'projecttype',
        getTypeId(
          type.toLowerCase() === 'scripture' ? type : 'generic',
          'project'
        )
      ),
      ...ReplaceRelatedRecord(t, project, 'group', 'group', getGroupId(teamId)),
      ...ReplaceRelatedRecord(
        t,
        project,
        'organization',
        'organization',
        teamId
      ),
      ...ReplaceRelatedRecord(t, project, 'owner', 'user', user),
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
      },
    } as any;
    memory.schema.initializeRecord(plan);
    await memory.update((t: TransformBuilder) => [
      ...AddRecord(t, plan, user, memory),
      ...ReplaceRelatedRecord(
        t,
        plan,
        'plantype',
        'plantype',
        getTypeId(type, 'plan')
      ),
      ...ReplaceRelatedRecord(t, plan, 'project', 'project', project.id),
    ]);
    //fetch the slug from the server
    if (!offlineOnly) {
      const remote = coordinator.getSource('remote') as JSONAPISource;
      await memory.sync(
        await remote.pull((q: any) =>
          q.findRecord({ type: 'plan', id: plan.id })
        )
      );
    }
    return plan.id;
  };
};
