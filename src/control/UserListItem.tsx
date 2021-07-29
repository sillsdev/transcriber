import React from 'react';
import { User } from '../model';
import { ListItem, ListItemIcon, ListItemText } from '@material-ui/core';
import UserAvatar from '../components/UserAvatar';

interface IProps {
  u: User;
  users: User[];
  onSelect?: (user: string) => void;
}
export const UserListItem = (props: IProps) => {
  const { u, users, onSelect } = props;

  const handleSelect = (user: string) => () => {
    onSelect && onSelect(user);
  };

  const ItemContent = () => (
    <>
      <ListItemIcon>
        <UserAvatar {...props} users={users} userRec={u} />
      </ListItemIcon>
      <ListItemText primary={u?.attributes?.name || ''} />
    </>
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
