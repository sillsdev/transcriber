import React from 'react';
import { useGlobal } from 'reactn';
import { IState, User } from '../model';
import { connect } from 'react-redux';
import { QueryBuilder } from '@orbit/data';
import { withData } from 'react-orbitjs';
import { Avatar } from '@material-ui/core';
import { makeAbbr } from '../utils';

interface IStateProps {}

interface IRecordProps {
  users: Array<User>;
}

interface IProps extends IStateProps, IRecordProps {
  userRec?: User;
}

export function UserAvatar(props: IProps) {
  const { userRec, users } = props;
  const [user] = useGlobal('user');

  const curUserRec = userRec
    ? []
    : users.filter(u => u.id === user && u.attributes);
  const curUser = userRec
    ? userRec
    : curUserRec.length > 0
    ? curUserRec[0]
    : { attributes: { avatarUrl: null, name: '' } };

  return curUser.attributes.avatarUrl ? (
    <Avatar alt={curUser.attributes.name} src={curUser.attributes.avatarUrl} />
  ) : (
    <Avatar>{makeAbbr(curUser.attributes.name)}</Avatar>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({});

// const mapDispatchToProps = (dispatch: any): IDispatchProps => ({
//   ...bindActionCreators({}, dispatch),
// });

const mapRecordsToProps = {
  users: (q: QueryBuilder) => q.findRecords('user'),
};

export default withData(mapRecordsToProps)(connect(mapStateToProps)(
  UserAvatar
) as any) as any;
