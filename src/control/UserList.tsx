import React from 'react';
import { User } from '../model';
import { makeStyles } from '@material-ui/core/styles';
import { List, ListItem, ListItemIcon, ListItemText } from '@material-ui/core';
import { UserAvatar } from '../components/UserAvatar';
import { QueryBuilder } from '@orbit/data';
import { withData } from '../mods/react-orbitjs';

const useStyles = makeStyles({
  listHead: {
    fontWeight: 'bold',
  },
});

interface IRecordProps {
  users: Array<User>;
}

interface IProps extends IRecordProps {
  isSelected: (userId: string) => boolean;
  select: (userId: string) => void;
  title?: string;
}

export const UserList = (props: IProps) => {
  const { users, isSelected, select, title } = props;
  const classes = useStyles();

  const handleSelect = (userId: string) => () => {
    select(userId);
  };

  return (
    <>
      {title && <div className={classes.listHead}>{title}</div>}
      <List>
        {users
          .filter((u) => isSelected(u.id))
          .sort((i, j) =>
            (i.attributes ? i.attributes.name : '') <
            (j.attributes ? j.attributes.name : '')
              ? -1
              : 1
          )
          .map((u) => (
            <ListItem key={u.id} onClick={handleSelect(u.id)}>
              <ListItemIcon>
                <UserAvatar {...props} users={users} userRec={u} />
              </ListItemIcon>
              <ListItemText primary={u.attributes ? u.attributes.name : ''} />
            </ListItem>
          ))}
      </List>
    </>
  );
};

const mapRecordsToProps = {
  users: (q: QueryBuilder) => q.findRecords('user'),
};

export default withData(mapRecordsToProps)(UserList) as any;
