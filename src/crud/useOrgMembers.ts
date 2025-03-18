import { useEffect, useState } from 'react';
import {
  OrganizationMembership,
  OrganizationMembershipD,
  RoleNames,
  User,
} from '../model';
import { useOrbitData } from '../hoc/useOrbitData';
import { useGlobal } from '../context/GlobalContext';
import related from './related';
import { useRole } from './useRole';

interface IProps {
  listAdmins: boolean;
  team?: string;
}

export const useOrgMembers = ({ team, listAdmins }: IProps) => {
  const users = useOrbitData<User[]>('user');
  const orgmems = useOrbitData<OrganizationMembership[]>(
    'organizationmembership'
  );
  const [orgUsers, setOrgUsers] = useState<User[]>([]);
  const [offlineOnly] = useGlobal('offlineOnly'); //will be constant here
  const [organization] = useGlobal('organization');
  const { getMbrRole } = useRole();

  useEffect(() => {
    var orgusers = orgmems
      .filter((om) => related(om, 'organization') === (team ?? organization))
      .filter(
        (om) =>
          listAdmins ||
          getMbrRole(om as OrganizationMembershipD) === RoleNames.Member
      )
      .map((om) => related(om, 'user'));

    setOrgUsers(
      users
        .filter(
          (u) =>
            u.attributes &&
            Boolean(u?.keys?.remoteId) !== offlineOnly &&
            orgusers.includes(u.id)
        )
        .sort((i, j) =>
          (i.attributes.familyName || '') < (j.attributes.familyName || '')
            ? -1
            : (i.attributes.familyName || '') > (j.attributes.familyName || '')
            ? 1
            : (i.attributes.givenName || '') <= (j.attributes.givenName || '')
            ? -1
            : 1
        )
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organization, team, users, orgmems, offlineOnly, listAdmins]);

  return orgUsers;
};
