import React from 'react';
import { useGlobal } from 'reactn';
import { ISharedStrings, IState, Role } from '../model';
import { connect } from 'react-redux';
import { QueryBuilder } from '@orbit/data';
import { withData } from 'react-orbitjs';
import { Avatar } from '@mui/material';
import { makeAbbr } from '../utils';
import { dataPath, PathType } from '../utils/dataPath';
import { remoteId } from '../crud';
import { isElectron } from '../api-variable';
import localStrings from '../selector/localize';
import { localizeRole } from '../utils';
import { avatarSize } from '../control';
const os = require('os');
const fs = require('fs');

interface IStateProps {
  ts: ISharedStrings;
}

interface IRecordProps {
  roles: Array<Role>;
}

interface IProps extends IStateProps, IRecordProps {
  roleRec: Role;
  small?: boolean;
}

export function RoleAvatar(props: IProps) {
  const { roleRec, small, ts } = props;
  const [memory] = useGlobal('memory');

  var src = dataPath(roleRec.attributes.roleName, PathType.AVATARS, {
    localname:
      remoteId('role', roleRec.id, memory.keyMap) +
      roleRec.attributes.roleName +
      '.png',
  });
  if (src && isElectron && !src.startsWith('http')) {
    if (fs.existsSync(src)) {
      const url =
        os.platform() === 'win32' ? new URL(src).toString().slice(8) : src;
      src = `transcribe-safe://${url}`;
    } else src = '';
  }
  return src ? (
    <Avatar
      alt={roleRec.attributes.roleName}
      src={src}
      sx={avatarSize(small)}
    />
  ) : roleRec.attributes && roleRec.attributes.roleName !== '' ? (
    <Avatar sx={avatarSize(small)}>
      {makeAbbr(localizeRole(roleRec.attributes.roleName, ts))}
    </Avatar>
  ) : (
    <></>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
  ts: localStrings(state, { layout: 'shared' }),
});
const mapRecordsToProps = {
  roles: (q: QueryBuilder) => q.findRecords('role'),
};

export default withData(mapRecordsToProps)(
  connect(mapStateToProps)(RoleAvatar) as any
) as any;
