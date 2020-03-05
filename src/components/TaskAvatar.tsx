import React from 'react';
import { useGlobal } from 'reactn';
import { User } from '../model';
import { QueryBuilder } from '@orbit/data';
import UserAvatar from './UserAvatar';

export const TaskAvatar = ({ assigned }: { assigned: string | null }) => {
  const [memory] = useGlobal('memory');

  if (!assigned) return <></>;
  const userRec: User = assigned
    ? (memory.cache.query((q: QueryBuilder) =>
        q.findRecord({ type: 'user', id: assigned as string })
      ) as User)
    : ({} as User);
  return <UserAvatar userRec={userRec} small={true} />;
};

export default React.memo(TaskAvatar);
