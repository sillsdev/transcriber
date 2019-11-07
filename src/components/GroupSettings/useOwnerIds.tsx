import { useGlobal } from 'reactn';
import { GroupMembership, Role } from '../../model';
import { related, getRoleId } from '../../utils';

interface IProps {
  groupMemberships: GroupMembership[];
  roles: Role[];
}

function useOwnerIds(props: IProps): string[] {
  const { groupMemberships, roles } = props;
  const [group] = useGlobal('group');

  const adminId = getRoleId(roles, 'admin');

  return groupMemberships
    .filter(
      gm => related(gm, 'group') === group && related(gm, 'role') === adminId[0]
    )
    .map(gm => related(gm, 'user'));
}

export default useOwnerIds;
