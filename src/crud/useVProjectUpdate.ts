import { useGlobal } from 'reactn';
import { Plan, Project, VProject } from '../model';
import { TransformBuilder } from '@orbit/data';
import { related, useTypeId } from '.';
import { UpdateRecord } from '../model/baseModel';

export const useVProjectUpdate = () => {
  const [memory] = useGlobal('memory');
  const [user] = useGlobal('user');
  const getTypeId = useTypeId();

  return async (vProject: VProject) => {
    const id = related(vProject, 'project');
    const {
      name,
      description,
      type,
      uilanguagebcp47,
      language,
      languageName,
      defaultFont,
      defaultFontSize,
      rtl,
      flat,
      tags,
      organizedBy,
    } = vProject.attributes;
    await memory.update((t: TransformBuilder) => [
      ...UpdateRecord(t, {
        type: 'project',
        id,
        attributes: {
          name,
          description,
          uilanguagebcp47,
          language,
          languageName,
          defaultFont,
          defaultFontSize,
          rtl,
        },
      } as Project, user),
      // We use the plan type and not the project type
      t.replaceRelatedRecord({type: 'project', id: id}, 'projecttype', {
        type: 'projecttype',
        id: getTypeId(
          type.toLowerCase() === 'scripture' ? type : 'generic',
          'project'
        ),
      }),
      //we aren't allowing them to change group, owner or oraganization currently
    ]);

    await memory.update((t: TransformBuilder) => [
      ...UpdateRecord(t, {
        type: 'plan',
        id: vProject.id,
        attributes: {
          name,
          flat,
          tags: JSON.stringify(tags),
          organizedBy,
        },
      } as any as Plan, user),
      t.replaceRelatedRecord({ type: 'plan', id: vProject.id }, 'plantype', {
        type: 'plantype',
        id: getTypeId(type, 'plan'),
      }),
    ]);
  };
};
