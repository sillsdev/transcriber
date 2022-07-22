import React from 'react';
import { useGlobal } from 'reactn';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import { ISharedStrings, IState, Group } from '../model';
import { connect } from 'react-redux';
import { QueryBuilder } from '@orbit/data';
import { withData } from '../mods/react-orbitjs';
import { Avatar } from '@material-ui/core';
import { makeAbbr } from '../utils';
import { dataPath, PathType } from '../utils/dataPath';
import { remoteId } from '../crud';
import { isElectron } from '../api-variable';
import localStrings from '../selector/localize';
const os = require('os');
const fs = require('fs');

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

interface IStateProps {
  ts: ISharedStrings;
}

interface IRecordProps {
  groups: Array<Group>;
}

interface IProps extends IStateProps, IRecordProps {
  groupRec: Group;
  small?: boolean;
}

export function GroupAvatar(props: IProps) {
  const { groupRec, small } = props;
  const classes = useStyles();
  const [memory] = useGlobal('memory');

  var src = dataPath(groupRec.attributes.name, PathType.AVATARS, {
    localname:
      remoteId('group', groupRec.id, memory.keyMap) +
      groupRec.attributes.name +
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
      alt={groupRec.attributes.name}
      src={src}
      className={small ? classes.small : classes.medium}
    />
  ) : groupRec.attributes && groupRec.attributes.name !== '' ? (
    <Avatar className={small ? classes.small : classes.medium}>
      {makeAbbr(groupRec.attributes.name)}
    </Avatar>
  ) : (
    <></>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
  ts: localStrings(state, { layout: 'shared' }),
});
const mapRecordsToProps = {
  groups: (q: QueryBuilder) => q.findRecords('group'),
};

export default withData(mapRecordsToProps)(
  connect(mapStateToProps)(GroupAvatar) as any
) as any;
