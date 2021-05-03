import React from 'react';
import { User } from '../model';
import { ListItem, ListItemIcon, ListItemText } from '@material-ui/core';
import UserAvatar from '../components/UserAvatar';

interface IProps {
  u: User;
  users: User[];
  onSelect: (user: string) => void;
}
export const UserListItem = (props: IProps) => {
  const { u, users, onSelect } = props;

  const handleSelect = (user: string) => () => {
    onSelect(user);
  };

  return (
    <ListItem id={`user-${u.id}`} key={u.id} onClick={handleSelect(u.id)}>
      <ListItemIcon>
        <UserAvatar {...props} users={users} userRec={u} />
      </ListItemIcon>
      <ListItemText primary={u?.attributes?.name || ''} />
    </ListItem>
  );
};
