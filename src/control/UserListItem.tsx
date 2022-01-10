import React from 'react';
import { User } from '../model';
import {
  Button,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core';
import UserAvatar from '../components/UserAvatar';
import { useOfflineTeamList } from '../crud';

const useStyles = makeStyles({
  button: {
    '& .MuiTypography-root': {
      textTransform: 'none',
    },
  },
});

interface IProps {
  u: User;
  users: User[];
  onSelect?: (user: string) => void;
  showTeams: boolean;
}
export const UserListItem = (props: IProps) => {
  const { u, users, onSelect, showTeams } = props;
  const classes = useStyles();
  const teams = useOfflineTeamList();

  const handleSelect = (user: string) => () => {
    onSelect && onSelect(user);
  };

  const ItemContent = () => (
    <Button variant="outlined" className={classes.button}>
      <ListItemIcon>
        <UserAvatar {...props} users={users} userRec={u} />
      </ListItemIcon>
      <ListItemText
        primary={u?.attributes?.name || ''}
        secondary={showTeams ? teams(u) : ''}
      />
    </Button>
  );

  return onSelect ? (
    <ListItem
      id={`user-${u.id}`}
      key={u.id}
      onClick={handleSelect(u.id)}
      button
    >
      <ItemContent />
    </ListItem>
  ) : (
    <ListItem id={`user-${u.id}`} key={u.id}>
      <ItemContent />
    </ListItem>
  );
};
