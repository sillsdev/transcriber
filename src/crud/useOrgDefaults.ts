import { TransformBuilder } from '@orbit/data';
import { useGlobal, useMemo } from 'reactn';
import { Organization, RoleNames } from '../model';
import { UpdateRecord } from '../model/baseModel';
import { findRecord } from './tryFindRecord';

export const useOrgDefaults = () => {
  const [organization] = useGlobal('organization');
  const [orgRole] = useGlobal('orgRole');
  const [user] = useGlobal('user');
  const [memory] = useGlobal('memory');
  const [offlineOnly] = useGlobal('offlineOnly');
  const [offline] = useGlobal('offline');

  const getDefault = (label: string, org: Organization) => {
    const json = JSON.parse(org.attributes?.defaultParams ?? '{}');
    if (json[label])
      if (typeof json[label] === 'string') return JSON.parse(json[label]);
      else return json[label];
    return undefined;
  };
  const getOrgDefault = (label: string, orgIn?: string) => {
    const org = findRecord(
      memory,
      'organization',
      orgIn ?? organization
    ) as Organization;
    return org ? getDefault(label, org) : undefined;
  };
  const setDefault = (label: string, value: any, org: Organization) => {
    const json = JSON.parse(org.attributes?.defaultParams ?? '{}');
    json[label] = JSON.stringify(value);
    org.attributes.defaultParams = JSON.stringify(json);
  };
  const setOrgDefault = (label: string, value: any, orgIn?: string) => {
    const org = findRecord(
      memory,
      'organization',
      orgIn ?? organization
    ) as Organization;
    if (!org) return; // no defaults on Personal Team
    setDefault(label, value, org);
    memory.update((t: TransformBuilder) => UpdateRecord(t, org, user));
  };
  const canSetOrgDefault = useMemo(
    () => orgRole === RoleNames.Admin && (offlineOnly || !offline),
    [offline, offlineOnly, orgRole]
  );

  return {
    getOrgDefault,
    setOrgDefault,
    getDefault,
    setDefault,
    canSetOrgDefault,
  };
};
