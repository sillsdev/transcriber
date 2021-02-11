import { useGlobal } from 'reactn';
import { GroupMembership, RoleNames } from '../../model';
import { related, useRole } from '../../crud';
import { IPerson } from './TeamCol';

interface IProps {
  groupMemberships: GroupMembership[];
}

function useTranscriberIds(props: IProps): IPerson[] {
  const { groupMemberships } = props;
  const { getRoleId } = useRole();
  const [group] = useGlobal('group');

  const transcriberId = getRoleId(RoleNames.Transcriber);

  return groupMemberships
    .filter((gm) => related(gm, 'group') === group)
    .map((gm) => ({
      canDelete: related(gm, 'role') === transcriberId,
      user: related(gm, 'user'),
    }));
}

export default useTranscriberIds;
