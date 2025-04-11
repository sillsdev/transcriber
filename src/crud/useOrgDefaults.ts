import { useMemo } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { Organization, OrganizationD, RoleNames } from '../model';
import { UpdateRecord } from '../model/baseModel';
import { findRecord } from './tryFindRecord';
import { useJsonParams } from '../utils/useJsonParams';

export const orgDefaultWorkflowProgression = 'WorkflowProgression';
export const orgDefaultDiscussionFilter = 'discussionFilter';
export const orgDefaultConsCheckComp = 'ConsultantCheckCompare';
export const orgDefaultSortTag = 'ktSort';
export const orgDefaultKtLang = 'ktLang';
export const orgDefaultKtExcludeTag = 'ktExcl';
export const orgDefaultResKw = 'ResKw';
export const orgDefaultLangProps = 'langProps';
export const orgDefaultFeatures = 'features';
export const orgDefaultVoices = 'voices';
export const orgDefaultAsr = 'asr';
export const orgDefaultPermissions = 'permissions';

export const useOrgDefaults = () => {
  const [organization] = useGlobal('organization');
  const [orgRole] = useGlobal('orgRole'); //verified this is not used in a function 2/18/25
  const [user] = useGlobal('user');
  const [memory] = useGlobal('memory');
  const [offlineOnly] = useGlobal('offlineOnly'); //verified this is not used in a function 2/18/25
  const [offline] = useGlobal('offline'); //verified this is not used in a function 2/18/25
  const { getParam, setParam } = useJsonParams();
  const getDefault = (label: string, org: Organization | OrganizationD) => {
    return getParam(label, org.attributes?.defaultParams);
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
    org.attributes.defaultParams = setParam(
      label,
      value,
      org.attributes.defaultParams
    );
  };
  const setOrgDefault = (label: string, value: any, orgIn?: string) => {
    const org = findRecord(
      memory,
      'organization',
      orgIn ?? organization
    ) as OrganizationD;
    if (!org) return; // no defaults on Personal Team
    setDefault(label, value, org);
    memory.update((t) => UpdateRecord(t, org, user));
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
