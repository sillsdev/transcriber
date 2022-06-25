import { useGlobal } from 'reactn';
import { Plan, Project, VProject } from '../model';
import { TransformBuilder } from '@orbit/data';
import { related, useTypeId } from '.';
import { ReplaceRelatedRecord, UpdateRecord } from '../model/baseModel';

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
      isPublic,
      spellCheck,
      defaultFont,
      defaultFontSize,
      rtl,
      flat,
      tags,
      organizedBy,
    } = vProject.attributes;
    await memory.update((t: TransformBuilder) => [
      ...UpdateRecord(
        t,
        {
          type: 'project',
          id,
          attributes: {
            name,
            description,
            uilanguagebcp47,
            language,
            languageName,
            isPublic,
            spellCheck,
            defaultFont,
            defaultFontSize,
            rtl,
          },
        } as Project,
        user
      ),
      // We use the plan type and not the project type
      ...ReplaceRelatedRecord(
        t,
        { type: 'project', id: id },
        'projecttype',
        'projecttype',
        getTypeId(
          type.toLowerCase() === 'scripture' ? type : 'generic',
          'project'
        )
      ),
      //we aren't allowing them to change group, owner or oraganization currently
    ]);

    await memory.update((t: TransformBuilder) => [
      ...UpdateRecord(
        t,
        {
          type: 'plan',
          id: vProject.id,
          attributes: {
            name,
            flat,
            tags: JSON.stringify(tags),
            organizedBy,
          },
        } as any as Plan,
        user
      ),
      ...ReplaceRelatedRecord(
        t,
        { type: 'plan', id: vProject.id },
        'plantype',
        'plantype',
        getTypeId(type, 'plan')
      ),
    ]);
  };
};
