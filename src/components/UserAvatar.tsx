import React from 'react';
import { useGlobal } from 'reactn';
import { User } from '../model';
import { QueryBuilder } from '@orbit/data';
import { withData } from 'react-orbitjs';
import { Avatar } from '@mui/material';
import { makeAbbr } from '../utils';
import { useAvatarSource } from '../crud';
import { avatarSize } from '../control';

interface IRecordProps {
  users: Array<User>;
}

interface IProps extends IRecordProps {
  userRec?: User;
  small?: boolean;
}

export function UserAvatar(props: IProps) {
  const { userRec, users, small } = props;
  const [user] = useGlobal('user');

  const curUserRec = userRec
    ? []
    : users.filter((u) => u.id === user && u.attributes);
  const curUser = userRec
    ? userRec
    : curUserRec.length > 0
    ? curUserRec[0]
    : {
        id: '',
        type: 'user',
        attributes: { avatarUrl: null, name: '', familyName: '' },
      };

  const source = useAvatarSource(curUser.attributes?.familyName || '', curUser);

  return source ? (
    <Avatar
      id="srcuser"
      alt={curUser.attributes?.name || ''}
      src={source}
      sx={avatarSize(small)}
    />
  ) : curUser.attributes && curUser.attributes.name !== '' ? (
    <Avatar id="abbruser" sx={avatarSize(small)}>
      {makeAbbr(curUser.attributes.name)}
    </Avatar>
  ) : (
    <></>
  );
}

const mapRecordsToProps = {
  users: (q: QueryBuilder) => q.findRecords('user'),
};

export default withData(mapRecordsToProps)(UserAvatar) as any;
