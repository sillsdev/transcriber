import React from 'react';
import { ISharedStrings, RoleD } from '../model';
import { Avatar } from '@mui/material';
import { makeAbbr } from '../utils';
import { useAvatarSource } from '../crud';
import { localizeRole } from '../utils';
import { avatarSize } from '../control';
import { useSelector } from 'react-redux';
import { sharedSelector } from '../selector';

interface IProps {
  roleRec: RoleD;
  small?: boolean;
}

export function RoleAvatar(props: IProps) {
  const { roleRec, small } = props;
  const ts: ISharedStrings = useSelector(sharedSelector);
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

export default RoleAvatar;
