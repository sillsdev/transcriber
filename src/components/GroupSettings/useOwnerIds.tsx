import { useGlobal } from 'reactn';
import { GroupMembership, RoleNames } from '../../model';
import { related, useRole } from '../../crud';
import { IPerson } from './TeamCol';

interface IProps {
  groupMemberships: GroupMembership[];
}

function useOwnerIds(props: IProps): IPerson[] {
  const { groupMemberships } = props;
  const { getRoleId } = useRole();
  const [group] = useGlobal('group');

  const adminId = getRoleId(RoleNames.Admin);

  let persons = groupMemberships
    .filter(
      (gm) => related(gm, 'group') === group && related(gm, 'role') === adminId
    )
    .map((gm) => ({
      canDelete: true,
      user: related(gm, 'user'),
    }));
  if (persons.length === 1) {
    persons[0].canDelete = false;
  }
  return persons;
}

export default useOwnerIds;
