import { useGlobal } from 'reactn';
import { VProject } from '../model';
import { useCoordinator } from '../crud';
import { TransformBuilder } from '@orbit/data';
import IndexedDBSource from '@orbit/indexeddb';
import { related, useTypeId } from '.';
import { useOfflnProjRead } from './useOfflnProjRead';

export const useVProjectUpdate = () => {
  const [memory] = useGlobal('memory');
  const coordinator = useCoordinator();
  const getTypeId = useTypeId();
  const offlineProject = useOfflnProjRead();

  return async (vProject: VProject) => {
    const id = related(vProject, 'project');
    const oProject = offlineProject(vProject);
    const {
      name,
      description,
      offlineAvailable,
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

    // local update only, migrate offlineproject to include offlineAvailable
    const backup = coordinator.getSource('backup') as IndexedDBSource;
    await memory.sync(
      await backup.push((t: TransformBuilder) => [
        t.updateRecord({
          ...oProject,
          attributes: {
            ...oProject.attributes,
            offlineAvailable,
          },
        }),
      ])
    );
  };
};
