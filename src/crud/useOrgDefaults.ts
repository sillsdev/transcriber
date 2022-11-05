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

  const getOrgDefault = (label: string) => {
    const org = findRecord(
      memory,
      'organization',
      organization
    ) as Organization;
    const json = JSON.parse(org?.attributes.defaultParams ?? '{}');
    if (json[label]) return JSON.parse(json[label]);
    return undefined;
  };
  const setOrgDefault = (label: string, value: any) => {
    const org = findRecord(
      memory,
      'organization',
      organization
    ) as Organization;

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
