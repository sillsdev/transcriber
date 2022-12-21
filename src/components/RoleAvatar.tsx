import React from 'react';
import { ISharedStrings, IState, Role } from '../model';
import { connect } from 'react-redux';
import { QueryBuilder } from '@orbit/data';
import { withData } from 'react-orbitjs';
import { Avatar } from '@mui/material';
import { makeAbbr } from '../utils';
import { useAvatarSource } from '../crud';
import localStrings from '../selector/localize';
import { localizeRole } from '../utils';
import { avatarSize } from '../control';

interface IStateProps {
  ts: ISharedStrings;
}

interface IRecordProps {
  roles: Array<Role>;
}

interface IProps extends IStateProps, IRecordProps {
  roleRec: Role;
  small?: boolean;
}

export function RoleAvatar(props: IProps) {
  const { roleRec, small, ts } = props;
  const source = useAvatarSource(roleRec.attributes.roleName, roleRec);

  return source ? (
    <Avatar
      alt={roleRec.attributes.roleName}
      src={source}
      sx={avatarSize(small)}
    />
  ) : roleRec.attributes && roleRec.attributes.roleName !== '' ? (
    <Avatar sx={avatarSize(small)}>
      {makeAbbr(localizeRole(roleRec.attributes.roleName, ts))}
    </Avatar>
  ) : (
    <></>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
  ts: localStrings(state, { layout: 'shared' }),
});
const mapRecordsToProps = {
  roles: (q: QueryBuilder) => q.findRecords('role'),
};

export default withData(mapRecordsToProps)(
  connect(mapStateToProps)(RoleAvatar) as any
) as any;
