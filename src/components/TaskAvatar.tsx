import React from 'react';
import UserAvatar from './UserAvatar';
import { findRecord, useUser } from '../crud';
import { RecordIdentity } from '@orbit/records';
import { Avatar } from '@mui/material';
import { GroupD } from '../model/group';
import { useGlobal } from '../context/GlobalContext';
import { makeAbbr } from '../utils';

export const TaskAvatar = ({
  assigned,
}: {
  assigned: RecordIdentity | null;
}) => {
  const { getUserRec } = useUser();
  const [memory] = useGlobal('memory');

  if (!assigned?.id) return <></>;
  if (assigned?.type === 'user') {
    const userRec = getUserRec(assigned.id);
    return <UserAvatar userRec={userRec} small={true} />;
  }
  const groupRec = findRecord(memory, 'group', assigned.id) as GroupD;
  const groupAbbr = makeAbbr(groupRec?.attributes?.name || groupRec?.id || '');
  if (!groupAbbr) return <></>;
  return (
    <Avatar id="assignGroup" variant="square" sx={{ width: 24, height: 24 }}>
      {groupAbbr}
    </Avatar>
  );
};

export default React.memo(TaskAvatar);
