import { useGlobal } from 'reactn';
import { Role, Organization, Group } from '../model';
import { QueryBuilder, TransformBuilder, RecordIdentity } from '@orbit/data';
import { currentDateTime } from '../utils';
import { allUsersRec } from '.';
import IndexedDBSource from '@orbit/indexeddb';

export const useOfflineSetup = () => {
  const [memory] = useGlobal('memory');
  const [coordinator] = useGlobal('coordinator');
  const [, setOrganization] = useGlobal('organization');

  return async () => {
    // local update only, migrate offlineproject to include offlineAvailable
    const backup = coordinator.getSource('backup') as IndexedDBSource;

    const roleRecs = memory.cache.query((q: QueryBuilder) =>
      q.findRecords('role')
    ) as Role[];
    if (roleRecs.length === 0) {
      let memberRec = {
        type: 'role',
        attributes: {
          orgRole: true,
          groupRole: true,
          roleName: 'member',
        },
      } as Role;
      memory.schema.initializeRecord(memberRec);
      let editorRec = {
        type: 'role',
        attributes: {
          orgRole: true,
          groupRole: true,
          roleName: 'editor',
        },
      } as Role;
      memory.schema.initializeRecord(editorRec);
      await memory.sync(
        await backup.push((t: TransformBuilder) => [
          t.addRecord(memberRec),
          t.addRecord(editorRec),
        ])
      );
    }
    const allOrgRecs = memory.cache.query((q: QueryBuilder) =>
      q.findRecords('organization')
    ) as Organization[];
    const offlineOrgs = allOrgRecs.filter(
      (o) => o.attributes.name === '>Offline Org<'
    );
    let orgId: RecordIdentity | null = null;
    if (offlineOrgs.length === 0) {
      let offlineOrg = {
        type: 'organization',
        attributes: {
          name: '>Offline Org<',
          slug: 'offline-org',
          silId: 0,
          description: 'Dummy offline org',
          websiteUrl: '',
          logoUrl: '',
          publicByDefault: true,
          dateCreated: currentDateTime(),
          dateUpdated: currentDateTime(),
        },
      } as Organization;
      memory.schema.initializeRecord(offlineOrg);
      await memory.sync(
        await backup.push((t: TransformBuilder) => [t.addRecord(offlineOrg)])
      );
      orgId = offlineOrg;
    } else {
      orgId = offlineOrgs[0];
    }
    setOrganization(orgId.id);
    const allUserRecs = allUsersRec(memory, orgId.id);
    if (allUserRecs.length === 0) {
      let allUserRec = {
        type: 'group',
        attributes: {
          name: 'All Users',
          abbreviation: 'All Users',
          allUsers: true,
        },
      } as Group;
      memory.schema.initializeRecord(allUserRec);
      await memory.sync(
        await backup.push((t: TransformBuilder) => [
          t.addRecord(allUserRec),
          t.replaceRelatedRecord(allUserRec, 'owner', orgId),
        ])
      );
    }
  };
};
