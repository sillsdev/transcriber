import React from 'react';
import { useGlobal } from 'reactn';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import { IState, Role } from '../model';
import { connect } from 'react-redux';
import { QueryBuilder } from '@orbit/data';
import { withData } from '../mods/react-orbitjs';
import { Avatar } from '@material-ui/core';
import { makeAbbr } from '../utils';
import { dataPath, PathType } from '../utils/dataPath';
import { remoteId } from '../crud';
import { isElectron } from '../api-variable';
const os = require('os');

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    small: {
      width: theme.spacing(3),
      height: theme.spacing(3),
    },
    medium: {
      width: theme.spacing(5),
      height: theme.spacing(5),
    },
  })
);

interface IStateProps {}

interface IRecordProps {
  roles: Array<Role>;
}

interface IProps extends IStateProps, IRecordProps {
  roleRec: Role;
  small?: boolean;
}

export function RoleAvatar(props: IProps) {
  const { roleRec, small } = props;
  const classes = useStyles();
  const [memory] = useGlobal('memory');

  var src = dataPath(roleRec.attributes.roleName, PathType.AVATARS, {
    localname:
      remoteId('role', roleRec.id, memory.keyMap) +
      roleRec.attributes.roleName +
      '.png',
  });
  if (src && isElectron && !src.startsWith('http')) {
    const url =
      os.platform() === 'win32' ? new URL(src).toString().slice(8) : src;
    src = `transcribe-safe://${url}`;
  }
  return src ? (
    <Avatar
      alt={roleRec.attributes.roleName}
      src={src}
      className={small ? classes.small : classes.medium}
    />
  ) : roleRec.attributes && roleRec.attributes.roleName !== '' ? (
    <Avatar className={small ? classes.small : classes.medium}>
      {makeAbbr(roleRec.attributes.roleName)}
    </Avatar>
  ) : (
    <></>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({});

const mapRecordsToProps = {
  roles: (q: QueryBuilder) => q.findRecords('role'),
};

export default withData(mapRecordsToProps)(
  connect(mapStateToProps)(RoleAvatar) as any
) as any;
