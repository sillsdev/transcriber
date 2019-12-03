import { useGlobal } from 'reactn';
import { GroupMembership } from '../../model';
import { related } from '../../utils';

interface IProps {
  groupMemberships: GroupMembership[];
}

function useTranscriberIds(props: IProps): string[] {
  const { groupMemberships } = props;
  const [group] = useGlobal('group');

  return groupMemberships
    .filter(gm => related(gm, 'group') === group)
    .map(gm => related(gm, 'user'));
}

export default useTranscriberIds;
