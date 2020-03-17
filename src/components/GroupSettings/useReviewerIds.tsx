import { useGlobal } from 'reactn';
import { GroupMembership, Role, RoleNames } from '../../model';
import { related, getRoleId } from '../../utils';
import { IPerson } from './TeamCol';

interface IProps {
  groupMemberships: GroupMembership[];
  roles: Role[];
}

function useReviewerIds(props: IProps): IPerson[] {
  const { groupMemberships, roles } = props;
  const [group] = useGlobal('group');

  const transcriberId = getRoleId(roles, RoleNames.Transcriber);
  const editorId = getRoleId(roles, RoleNames.Reviewer);

  return groupMemberships
    .filter(
      gm =>
        related(gm, 'group') === group && related(gm, 'role') !== transcriberId
    )
    .map(gm => ({
      canDelete: related(gm, 'role') === editorId,
      user: related(gm, 'user'),
    }));
}
export default useReviewerIds;
