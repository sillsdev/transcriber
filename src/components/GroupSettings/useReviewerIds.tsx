import { useGlobal } from 'reactn';
import { GroupMembership, RoleNames } from '../../model';
import { related, useRole } from '../../crud';
import { IPerson } from './TeamCol';

interface IProps {
  groupMemberships: GroupMembership[];
}

function useReviewerIds(props: IProps): IPerson[] {
  const { groupMemberships } = props;
  const { getEditorRoleIds, getRoleId } = useRole();
  const [group] = useGlobal('group');

  const editorIds = getEditorRoleIds();
  const adminId = getRoleId(RoleNames.Admin);
  return groupMemberships
    .filter(
      (gm) =>
        related(gm, 'group') === group &&
        editorIds.includes(related(gm, 'role'))
    )
    .map((gm) => ({
      canDelete: related(gm, 'role') !== adminId,
      user: related(gm, 'user'),
    }));
}
export default useReviewerIds;
