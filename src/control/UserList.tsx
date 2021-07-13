import React from 'react';
import { User } from '../model';
import { makeStyles } from '@material-ui/core/styles';
import { List } from '@material-ui/core';
import { UserListItem } from '.';
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

  return (
    <>
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
            <UserListItem u={u} users={users} onSelect={select} />
          ))}
      </List>
    </>
  );
};

const mapRecordsToProps = {
  users: (q: QueryBuilder) => q.findRecords('user'),
};

export default withData(mapRecordsToProps)(UserList) as any;
