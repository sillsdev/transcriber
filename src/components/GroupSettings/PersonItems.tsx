import React from 'react';
import { useGlobal } from 'reactn';
import { connect } from 'react-redux';
import { User } from '../../model';
import { withData } from '../../mods/react-orbitjs';
import { QueryBuilder } from '@orbit/data';
import {
  ListItem,
  ListItemAvatar,
  ListItemSecondaryAction,
  ListItemText,
  IconButton,
  Tooltip,
} from '@material-ui/core';
import DeleteIcon from '@material-ui/icons/Delete';
import InfoIcon from '@material-ui/icons/Info';
import UserAvatar from '../UserAvatar';
import useStyles from './GroupSettingsStyles';
import Involvement from './Involvement';
import { IPerson } from './TeamCol';

interface IRecordProps {
  users: Array<User>;
}

interface IProps extends IRecordProps {
  title: string;
  detail: boolean;
  ids: Array<IPerson>;
  rev: boolean;
  del?: (id: string, name: string) => void;
  allUsers?: boolean;
  noDeleteInfo?: string;
  noDeleteAllUsersInfo?: string;
}

function PersonItems(props: IProps) {
  const {
    title,
    detail,
    users,
    ids,
    rev,
    del,
    allUsers,
    noDeleteInfo,
    noDeleteAllUsersInfo,
  } = props;
  const classes = useStyles();
  const [orgRole] = useGlobal('orgRole');

  const handleDel = (id: string, name: string) => () => {
    if (del) del(id, name);
  };

  return (
    <>
      {users
        .filter(
          (u) => u.attributes && ids.map((id) => id.user).indexOf(u.id) !== -1
        )
        .sort((i, j) => (i.attributes.name < j.attributes.name ? -1 : 1))
        .map((u, index) => (
          <ListItem
            key={u.id}
            disabled={
              !detail && !ids.filter((id) => id.user === u.id)[0].canDelete
            }
          >
            <ListItemAvatar className={classes.avatar}>
              <UserAvatar {...props} userRec={u} />
            </ListItemAvatar>
            <ListItemText
              primary={u.attributes.name}
              secondary={detail ? <Involvement user={u.id} rev={rev} /> : null}
            />
            {del &&
              !detail &&
              orgRole === 'admin' &&
              ids.filter((id) => id.user === u.id)[0].canDelete &&
              !allUsers && (
                <ListItemSecondaryAction>
                  <IconButton
                    id={`persDel${title}${index}`}
                    edge="end"
                    aria-label="Delete"
                    disabled={allUsers}
                    onClick={handleDel(u.id, u.attributes.name)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              )}
            {del &&
              !detail &&
              orgRole === 'admin' &&
              (!ids.filter((id) => id.user === u.id)[0].canDelete ||
                allUsers) && (
                <ListItemSecondaryAction>
                  <Tooltip
                    id={`tip${title}${index}`}
                    title={
                      !ids.filter((id) => id.user === u.id)[0].canDelete
                        ? noDeleteInfo || ''
                        : noDeleteAllUsersInfo || ''
                    }
                  >
                    <IconButton
                      id={`info${title}${index}`}
                      edge="end"
                      aria-label="Info"
                    >
                      <InfoIcon />
                    </IconButton>
                  </Tooltip>
                </ListItemSecondaryAction>
              )}
          </ListItem>
        ))}
    </>
  );
}

const mapStateToProps = () => ({});

const mapRecordsToProps = {
  users: (q: QueryBuilder) => q.findRecords('user'),
};

export default withData(mapRecordsToProps)(
  connect(mapStateToProps)(PersonItems) as any
) as any;
