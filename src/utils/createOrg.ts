import Memory from '@orbit/memory';
import JSONAPISource from '@orbit/jsonapi';
import { Organization } from '../model';
import { QueryBuilder, TransformBuilder } from '@orbit/data';
import { setDefaultProj } from './setDefaultProj';
import Coordinator from '@orbit/coordinator';
import { orbitErr } from '.';
import { IApiError } from '../model';

export const ReloadOrgTables = async (
  memory: Memory,
  remote: JSONAPISource
) => {
  await remote
    .pull((q) => q.findRecords('organization'))
    .then((transform) => memory.sync(transform));
  await remote
    .pull((q) => q.findRecords('organizationmembership'))
    .then((transform) => memory.sync(transform));
  await remote
    .pull((q) => q.findRecords('group'))
    .then((transform) => memory.sync(transform));
  await remote
    .pull((q) => q.findRecords('groupmembership'))
    .then((transform) => memory.sync(transform));
  await remote
    .pull((q) => q.findRecords('user'))
    .then((transform) => memory.sync(transform));
};

export interface ICreateOrgProps {
  orgRec: Organization;
  user: string;
  coordinator: Coordinator;
  online: boolean;
  setOrganization: (id: string) => void;
  setProject: (id: string) => void;
  doOrbitError: (ex: IApiError) => void;
}

export const createOrg = async (props: ICreateOrgProps) => {
  const { orgRec, user, coordinator, online } = props;
  const { setOrganization, setProject, doOrbitError } = props;

  const memory = coordinator.getSource('memory') as Memory;
  const remote = coordinator.getSource('remote') as JSONAPISource;
  if (!remote || !online)
    throw new Error('Creating an Org is not available offline');

  memory.schema.initializeRecord(orgRec);

  remote
    .update((t: TransformBuilder) => [
      t.addRecord(orgRec),
      t.replaceRelatedRecord({ type: 'organization', id: orgRec.id }, 'owner', {
        type: 'user',
        id: user,
      }),
    ])
    .then(() => {
      ReloadOrgTables(memory, remote).then(() => {
        const newOrgRec: Organization[] = memory.cache.query(
          (q: QueryBuilder) =>
            q
              .findRecords('organization')
              .filter({ attribute: 'name', value: orgRec.attributes.name })
        ) as any;
        setOrganization(newOrgRec[0].id);
        setDefaultProj(newOrgRec[0].id, memory, setProject);
      });
    })
    .catch((err: Error) => {
      var x = orbitErr(err, 'CreateOrg');
      doOrbitError(x);
      console.log(err.message);
    });
};

export default createOrg;
