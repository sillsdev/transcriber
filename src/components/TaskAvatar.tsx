import React from 'react';
import UserAvatar from './UserAvatar';
import { useUser } from '../crud';

export const TaskAvatar = ({ assigned }: { assigned: string | null }) => {
  const { getUserRec } = useUser();

  if (!assigned || assigned === '') return <></>;
  const userRec = getUserRec(assigned);
  return <UserAvatar userRec={userRec} small={true} />;
};

export default React.memo(TaskAvatar);
