import { useGlobal } from 'reactn';
import { GroupMembership, RoleNames } from '../../model';
import { related, useRole } from '../../crud';
import { IPerson } from './TeamCol';

interface IProps {
  groupMemberships: GroupMembership[];
}

function useReviewerIds(props: IProps): IPerson[] {
  const { groupMemberships } = props;
  const { getRoleId } = useRole();
  const [group] = useGlobal('group');

  const transcriberId = getRoleId(RoleNames.Transcriber);
  const editorId = getRoleId(RoleNames.Editor);

  return groupMemberships
    .filter(
      (gm) =>
        related(gm, 'group') === group && related(gm, 'role') !== transcriberId
    )
    .map((gm) => ({
      canDelete: related(gm, 'role') === editorId,
      user: related(gm, 'user'),
    }));
}
export default useReviewerIds;
