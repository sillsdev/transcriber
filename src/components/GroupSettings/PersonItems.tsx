import React from 'react';
import { useGlobal } from 'reactn';
import { connect } from 'react-redux';
import { User } from '../../model';
import { withData } from 'react-orbitjs';
import { QueryBuilder } from '@orbit/data';
import {
  ListItem,
  ListItemAvatar,
  ListItemSecondaryAction,
  ListItemText,
  IconButton,
} from '@material-ui/core';
import DeleteIcon from '@material-ui/icons/Delete';
import UserAvatar from '../UserAvatar';
import useStyles from './GroupSettingsStyles';
import Involvement from './Involvement';

interface IRecordProps {
  users: Array<User>;
}

interface IProps extends IRecordProps {
  detail: boolean;
  ids: Array<string>;
  rev: boolean;
  del: (id: string, name: string) => void;
  allUsers?: boolean;
}

function PersonItems(props: IProps) {
  const { detail, users, ids, rev, del, allUsers } = props;
  const classes = useStyles();
  const [orgRole] = useGlobal('orgRole');

  const handeleDel = (id: string, name: string) => () => del(id, name);

  return (
    <>
      {users
        .filter(u => u.attributes && ids.indexOf(u.id) !== -1)
        .sort((i, j) => (i.attributes.name < j.attributes.name ? -1 : 1))
        .map(u => (
          <ListItem>
            <ListItemAvatar className={classes.avatar}>
              <UserAvatar {...props} userRec={u} />
            </ListItemAvatar>
            <ListItemText
              primary={u.attributes.name}
              secondary={detail ? <Involvement user={u.id} rev={rev} /> : null}
            />
            {!detail && orgRole === 'admin' && !allUsers && (
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  aria-label="Delete"
                  onClick={handeleDel(u.id, u.attributes.name)}
                >
                  <DeleteIcon />
                </IconButton>
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
