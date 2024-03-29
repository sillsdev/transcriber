import { TransformBuilder } from '@orbit/data';
import { useMemo } from 'react';
import { useGlobal } from 'reactn';
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

  const getOrgDefault = (label: string, orgIn?: string) => {
    const org = findRecord(
      memory,
      'organization',
      orgIn ?? organization
    ) as Organization;
    const json = JSON.parse(org?.attributes.defaultParams ?? '{}');
    if (json[label])
      if (typeof json[label] === 'string') return JSON.parse(json[label]);
      else return json[label];
    return undefined;
  };
  const setOrgDefault = (label: string, value: any, orgIn?: string) => {
    const org = findRecord(
      memory,
      'organization',
      orgIn ?? organization
    ) as Organization;
    if (!org) return; // no defaults on Personal Team

    const json = JSON.parse(org.attributes.defaultParams ?? '{}');
    json[label] = JSON.stringify(value);
    org.attributes.defaultParams = JSON.stringify(json);
    memory.update((t: TransformBuilder) => UpdateRecord(t, org, user));
  };
  const canSetOrgDefault = useMemo(
    () => orgRole === RoleNames.Admin && (offlineOnly || !offline),
    [offline, offlineOnly, orgRole]
  );

  return { getOrgDefault, setOrgDefault, canSetOrgDefault };
};
