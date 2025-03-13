import { useMemo, useState } from 'react';
import { useOrbitData } from '../hoc/useOrbitData';
import { UserD, GroupD } from '../model';

export const userPrefix = 'u:';
export const groupPrefix = 'g:';

export const useGroupOrUser = () => {
  const users = useOrbitData<UserD[]>('user');
  const groups = useOrbitData<GroupD[]>('group');

  const [editAssigned, setEditAssigned] = useState<string>('');

  const assignedGroup = useMemo(() => {
    return editAssigned.startsWith(groupPrefix)
      ? groups?.find((g) => g.id === editAssigned.substring(groupPrefix.length))
      : null;
  }, [editAssigned, groups]);

  const assignedUser = useMemo(() => {
    return editAssigned.startsWith(userPrefix)
      ? users?.find((u) => u.id === editAssigned.substring(userPrefix.length))
      : null;
  }, [editAssigned, users]);

  const setAssigned = (
    groupid: string | undefined | null,
    userid: string | undefined | null
  ) => {
    if (groupid) {
      if (editAssigned !== groupPrefix + groupid)
        setEditAssigned(groupPrefix + groupid);
    } else if (userid) {
      if (editAssigned !== userPrefix + userid)
        setEditAssigned(userPrefix + userid);
    } else setEditAssigned('');
  };

  return {
    assignedGroup,
    assignedUser,
    editAssigned,
    setEditAssigned,
    setAssigned,
  };
};
