import { useGlobal } from 'reactn';
import { GroupMembership, Role, RoleNames } from '../../model';
import { related, getRoleId } from '../../utils';
import { IPerson } from './TeamCol';

interface IProps {
  groupMemberships: GroupMembership[];
  roles: Role[];
}

function useOwnerIds(props: IProps): IPerson[] {
  const { groupMemberships, roles } = props;
  const [group] = useGlobal('group');

  const adminId = getRoleId(roles, RoleNames.Admin);

  return groupMemberships
    .filter(
      gm => related(gm, 'group') === group && related(gm, 'role') === adminId
    )
    .map(gm => ({
      canDelete: true,
      user: related(gm, 'user'),
    }));
}

export default useOwnerIds;
