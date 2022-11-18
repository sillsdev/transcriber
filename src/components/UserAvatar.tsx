import React from 'react';
import { useGlobal } from 'reactn';
import { User } from '../model';
import { QueryBuilder } from '@orbit/data';
import { withData } from 'react-orbitjs';
import { Avatar } from '@mui/material';
import { makeAbbr } from '../utils';
import { dataPath, PathType } from '../utils/dataPath';
import { remoteId } from '../crud';
import { isElectron } from '../api-variable';
import { avatarSize } from '../control';
const os = require('os');

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
  const [memory] = useGlobal('memory');

  const curUserRec = userRec
    ? []
    : users.filter((u) => u.id === user && u.attributes);
  const curUser = userRec
    ? userRec
    : curUserRec.length > 0
    ? curUserRec[0]
    : { id: '', attributes: { avatarUrl: null, name: '', familyName: '' } };

  var src =
    curUser.attributes && curUser.attributes.avatarUrl
      ? dataPath(curUser.attributes.avatarUrl, PathType.AVATARS, {
          localname:
            remoteId('user', curUser.id, memory.keyMap) +
            curUser.attributes.familyName +
            '.png',
        })
      : '';
  if (src && isElectron && !src.startsWith('http')) {
    const url =
      os.platform() === 'win32' ? new URL(src).toString().slice(8) : src;
    src = `transcribe-safe://${url}`;
  }
  return src ? (
    <Avatar
      id="srcuser"
      alt={curUser.attributes.name}
      src={src}
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
