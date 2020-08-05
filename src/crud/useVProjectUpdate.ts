import { useGlobal } from 'reactn';
import { VProject } from '../model';
import { TransformBuilder } from '@orbit/data';
import { related } from '../utils';
import { useTypeId } from '.';

export const useVProjectUpdate = () => {
  const [memory] = useGlobal('memory');
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
      t.updateRecord({
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
          allowClaim: true,
          isPublic: true,
        },
      }),
      // We use the plan type and not the project type
      // t.replaceRelatedRecord({ type: 'project', id }, 'projecttype', {
      //   type: 'projecttype',
      //   id: getTypeId(type, 'project'),
      // }),
      //we aren't allowing them to change group, owner or oraganization currently
    ]);

    await memory.update((t: TransformBuilder) => [
      t.updateRecord({
        type: 'plan',
        id: vProject.id,
        attributes: {
          name,
          flat,
          tags: JSON.stringify(tags),
          organizedBy,
        },
      }),
      t.replaceRelatedRecord({ type: 'plan', id: vProject.id }, 'plantype', {
        type: 'plantype',
        id: getTypeId(type, 'plan'),
      }),
    ]);
  };
};
