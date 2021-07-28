import React, { ReactElement } from 'react';
import { User } from '../model';
import { List } from '@material-ui/core';
import { UserListItem } from '.';
import { QueryBuilder } from '@orbit/data';
import { withData } from '../mods/react-orbitjs';

export interface ListAction {
  [key: string]: ReactElement;
}

interface IRecordProps {
  users: Array<User>;
}

interface IProps extends IRecordProps {
  isSelected: (userId: string) => boolean;
  curId: string | undefined;
  select?: (userId: string) => void;
}

export const UserList = (props: IProps) => {
  const { users, isSelected, curId, select } = props;

  return (
    <>
      <List>
        {users
          .filter((u) => u.id !== curId && isSelected(u.id))
          .sort((i, j) =>
            (i.attributes ? i.attributes.name : '') <
            (j.attributes ? j.attributes.name : '')
              ? -1
              : 1
          )
          .map((u, i) => (
            <UserListItem u={u} key={i} users={users} onSelect={select} />
          ))}
      </List>
    </>
  );
};

const mapRecordsToProps = {
  users: (q: QueryBuilder) => q.findRecords('user'),
};

export default withData(mapRecordsToProps)(UserList) as any;
