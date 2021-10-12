import React from 'react';
import { useGlobal } from 'reactn';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import { IState, User } from '../model';
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
  users: Array<User>;
}

interface IProps extends IStateProps, IRecordProps {
  userRec?: User;
  small?: boolean;
}

export function UserAvatar(props: IProps) {
  const { userRec, users, small } = props;
  const classes = useStyles();
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
    const url = os.platform() === 'win32' ? new URL(src).toString().slice(8): src;
    src = `transcribe-safe://${url}`;
  }
  return src ? (
    <Avatar
      alt={curUser.attributes.name}
      src={src}
      className={small ? classes.small : classes.medium}
    />
  ) : curUser.attributes && curUser.attributes.name !== '' ? (
    <Avatar className={small ? classes.small : classes.medium}>
      {makeAbbr(curUser.attributes.name)}
    </Avatar>
  ) : (
    <></>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({});

const mapRecordsToProps = {
  users: (q: QueryBuilder) => q.findRecords('user'),
};

export default withData(mapRecordsToProps)(
  connect(mapStateToProps)(UserAvatar) as any
) as any;
