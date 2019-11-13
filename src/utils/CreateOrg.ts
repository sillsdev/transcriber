import Memory from '@orbit/memory';
import JSONAPISource from '@orbit/jsonapi';
import { Organization } from '../model';
import { Schema, QueryBuilder, TransformBuilder } from '@orbit/data';
import { setDefaultProj } from './setDefaultProj';

export const ReloadOrgTables = async (
  memory: Memory,
  remote: JSONAPISource
) => {
  await remote
    .pull(q => q.findRecords('organization'))
    .then(transform => memory.sync(transform));
  await remote
    .pull(q => q.findRecords('organizationmembership'))
    .then(transform => memory.sync(transform));
  await remote
    .pull(q => q.findRecords('group'))
    .then(transform => memory.sync(transform));
  await remote
    .pull(q => q.findRecords('groupmembership'))
    .then(transform => memory.sync(transform));
  await remote
    .pull(q => q.findRecords('user'))
    .then(transform => memory.sync(transform));
};

export interface ICreateOrgProps {
  orgRec: Organization;
  user: string;
  memory: Memory;
  remote: JSONAPISource;
  schema: Schema;
  setOrganization: (id: string) => void;
  setProject: (id: string) => void;
}

export const CreateOrg = async (props: ICreateOrgProps) => {
  const { orgRec, user, schema, memory, remote } = props;
  const { setOrganization, setProject } = props;

  schema.initializeRecord(orgRec);

  await remote.update((t: TransformBuilder) => [
    t.addRecord(orgRec),
    t.replaceRelatedRecord({ type: 'organization', id: orgRec.id }, 'owner', {
      type: 'user',
      id: user,
    }),
  ]);
  await ReloadOrgTables(memory, remote);
  const newOrgRec: Organization[] = memory.cache.query((q: QueryBuilder) =>
    q
      .findRecords('organization')
      .filter({ attribute: 'name', value: orgRec.attributes.name })
  ) as any;
  setOrganization(newOrgRec[0].id);
  setDefaultProj(newOrgRec[0].id, memory, setProject);
};

export default CreateOrg;
