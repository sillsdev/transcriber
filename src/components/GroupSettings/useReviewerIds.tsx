import { useGlobal } from 'reactn';
import { GroupMembership, Role, RoleNames } from '../../model';
import { related, getRoleId } from '../../utils';

interface IProps {
  groupMemberships: GroupMembership[];
  roles: Role[];
}

function useReviewerIds(props: IProps): string[] {
  const { groupMemberships, roles } = props;
  const [group] = useGlobal('group');

  const transcriberId = getRoleId(roles, RoleNames.Transcriber);

  return groupMemberships
    .filter(
      gm =>
        related(gm, 'group') === group && related(gm, 'role') !== transcriberId
    )
    .map(gm => related(gm, 'user'));
}
export default useReviewerIds;
