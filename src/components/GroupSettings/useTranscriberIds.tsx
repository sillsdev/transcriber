import { useGlobal } from 'reactn';
import { GroupMembership } from '../../model';
import { related, useRole } from '../../crud';
import { IPerson } from './TeamCol';

interface IProps {
  groupMemberships: GroupMembership[];
}

function useTranscriberIds(props: IProps): IPerson[] {
  const { groupMemberships } = props;
  const { getTranscriberRoleIds, getEditorRoleIds } = useRole();
  const [group] = useGlobal('group');

  const transcriberIds = getTranscriberRoleIds();
  const editorIds = getEditorRoleIds();
  return groupMemberships
    .filter(
      (gm) =>
        related(gm, 'group') === group &&
        transcriberIds.includes(related(gm, 'role'))
    )
    .map((gm) => ({
      canDelete: !editorIds.includes(related(gm, 'role')),
      user: related(gm, 'user'),
    }));
}

export default useTranscriberIds;
