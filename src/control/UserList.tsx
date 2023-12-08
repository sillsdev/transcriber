import React, { ReactElement } from 'react';
import { UserD } from '../model';
import { List } from '@mui/material';
import { UserListItem } from '.';
import { useOrbitData } from '../hoc/useOrbitData';

export interface ListAction {
  [key: string]: ReactElement;
}

interface IProps {
  isSelected: (userId: string) => boolean;
  curId?: string | undefined;
  select?: (userId: string) => void;
  showTeams?: boolean;
}

export const UserList = (props: IProps) => {
  const { isSelected, curId, select, showTeams } = props;
  const users = useOrbitData<UserD[]>('user');

  return (
    <>
      <List>
        {users
          .filter((u) => u.id !== curId && isSelected(u.id))
          .sort((i, j) =>
            (i.attributes ? i.attributes.name : '') <=
            (j.attributes ? j.attributes.name : '')
              ? -1
              : 1
          )
          .map((u, i) => (
            <UserListItem
              u={u}
              key={i}
              onSelect={select}
              showTeams={showTeams ?? false}
            />
          ))}
      </List>
    </>
  );
};

export default UserList;
