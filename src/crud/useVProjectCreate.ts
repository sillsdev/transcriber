import { useGlobal } from '../context/GlobalContext';
import { VProject, Project, Plan, Group } from '../model';
import { related, useTypeId, useOfflnProjCreate } from '.';
import {
  useProjectsLoaded,
  localeDefault,
  currentDateTime,
  cleanFileName,
} from '../utils';
import JSONAPISource from '@orbit/jsonapi';
import { AddRecord, ReplaceRelatedRecord } from '../model/baseModel';
import { InitializedRecord } from '@orbit/records';
import { recToMemory } from './syncToMemory';

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
    const grpRecs = memory?.cache.query((q) =>
      q.findRecords('group')
    ) as Group[];
    const selected = grpRecs.filter(
      (g) => g?.attributes?.allUsers && related(g, 'owner') === teamId
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
      defaultParams,
    } = vProject.attributes;

    let project: Project = {
      type: 'project',
      attributes: {
        name,
        description,
        uilanguagebcp47: localeDefault(isDeveloper === 'true'),
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
        defaultParams,
      },
    } as Project;
    await memory.update((t) => [
      ...AddRecord(t, project, user, memory),
      // We use the plan type and not the project type
      ...ReplaceRelatedRecord(
        t,
        project as InitializedRecord,
        'projecttype',
        'projecttype',
        getTypeId(
          type.toLowerCase() === 'scripture' ? type : 'generic',
          'project'
        )
      ),
      ...ReplaceRelatedRecord(
        t,
        project as InitializedRecord,
        'group',
        'group',
        getGroupId(teamId)
      ),
      ...ReplaceRelatedRecord(
        t,
        project as InitializedRecord,
        'organization',
        'organization',
        teamId
      ),
      ...ReplaceRelatedRecord(
        t,
        project as InitializedRecord,
        'owner',
        'user',
        user
      ),
    ]);
    await offlineProjectCreate(project);
    AddProjectLoaded(project.id as string);
    let slug = cleanFileName(name).substring(0, 6);
    if (offlineOnly) {
      //see if slug is unique
      const plans = memory?.cache.query((q) => q.findRecords('plan')) as Plan[];
      let tmp = '';
      let findit = (fnd: string) =>
        plans.findIndex((p) => p.attributes?.slug === fnd);
      while (findit(slug + tmp) > 0) {
        tmp = ((parseInt(tmp) ?? 0) + 1).toString();
      }
      slug += tmp;
    }
    let plan: Plan = {
      type: 'plan',
      attributes: {
        name,
        flat,
        tags: JSON.stringify(tags),
        organizedBy,
        slug: slug,
      },
    } as any;
    await memory.update((t) => [
      ...AddRecord(t, plan, user, memory),
      ...ReplaceRelatedRecord(
        t,
        plan as InitializedRecord,
        'plantype',
        'plantype',
        getTypeId(type, 'plan')
      ),
      ...ReplaceRelatedRecord(
        t,
        plan as InitializedRecord,
        'project',
        'project',
        project.id
      ),
    ]);
    //fetch the slug from the server
    if (!offlineOnly) {
      const remote = coordinator?.getSource('remote') as JSONAPISource;
      await recToMemory({
        recId: { type: 'plan', id: plan.id as string },
        memory,
        remote,
      });
    }
    return plan.id as string;
  };
};
