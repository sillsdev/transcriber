import { useGlobal } from 'reactn';
import { GroupMembership, Role, RoleNames } from '../../model';
import { related, getRoleId } from '../../crud';
import { IPerson } from './TeamCol';

interface IProps {
  groupMemberships: GroupMembership[];
  roles: Role[];
}

function useTranscriberIds(props: IProps): IPerson[] {
  const { groupMemberships, roles } = props;
  const [group] = useGlobal('group');

  const transcriberId = getRoleId(roles, RoleNames.Transcriber);

  return groupMemberships
    .filter((gm) => related(gm, 'group') === group)
    .map((gm) => ({
      canDelete: related(gm, 'role') === transcriberId,
      user: related(gm, 'user'),
    }));
}

export default useTranscriberIds;
