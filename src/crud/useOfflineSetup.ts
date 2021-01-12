import { useGlobal } from 'reactn';
import { Role, ProjectType } from '../model';
import { QueryBuilder, TransformBuilder } from '@orbit/data';
import Coordinator from '@orbit/coordinator';
import Memory from '@orbit/memory';
import IndexedDBSource from '@orbit/indexeddb';

export const useOfflineSetup = () => {
  const [memory] = useGlobal('memory');
  const [coordinator] = useGlobal('coordinator');

  const makeTypeRecs = async (coordinator: Coordinator, kind: string) => {
    const memory = coordinator.getSource('memory') as Memory;
    const backup = coordinator.getSource('backup') as IndexedDBSource;

    const typeRecs = memory.cache.query((q: QueryBuilder) =>
      q.findRecords(`${kind}type`)
    ) as ProjectType[];
    if (typeRecs.length === 0) {
      let scriptureRec: ProjectType = {
        type: `${kind}type`,
        attributes: {
          name: 'Scripture',
        },
      } as any;
      memory.schema.initializeRecord(scriptureRec);
      let otherRec: ProjectType = {
        type: `${kind}type`,
        attributes: {
          name: 'Other',
        },
      } as any;
      memory.schema.initializeRecord(otherRec);
      await memory.sync(
        await backup.push((t: TransformBuilder) => [
          t.addRecord(scriptureRec),
          t.addRecord(otherRec),
        ])
      );
    }
  };

  return async () => {
    // local update only, migrate offlineproject to include offlineAvailable
    const backup = coordinator.getSource('backup') as IndexedDBSource;

    const roleRecs = memory.cache.query((q: QueryBuilder) =>
      q.findRecords('role')
    ) as Role[];
    if (roleRecs.length === 0) {
      let adminRec = {
        type: 'role',
        attributes: {
          orgRole: true,
          groupRole: true,
          roleName: 'Admin',
        },
      } as Role;
      memory.schema.initializeRecord(adminRec);
      let memberRec = {
        type: 'role',
        attributes: {
          orgRole: true,
          groupRole: false,
          roleName: 'Member',
        },
      } as Role;
      memory.schema.initializeRecord(memberRec);
      let editorRec = {
        type: 'role',
        attributes: {
          orgRole: false,
          groupRole: true,
          roleName: 'Editor',
        },
      } as Role;
      memory.schema.initializeRecord(editorRec);
      await memory.sync(
        await backup.push((t: TransformBuilder) => [
          t.addRecord(adminRec),
          t.addRecord(memberRec),
          t.addRecord(editorRec),
        ])
      );
    }
    await makeTypeRecs(coordinator, 'project');
    await makeTypeRecs(coordinator, 'plan');
  };
};
