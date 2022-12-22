import { MenuItem, TextField } from '@mui/material';
import { useEffect, useState } from 'react';
import {
  GroupMembership,
  ISharedStrings,
  IPeerStrings,
  User,
  Group,
} from '../model';
import { QueryBuilder } from '@orbit/data';
import { withData } from 'react-orbitjs';
import { usePeerGroups } from '../components/Peers/usePeerGroups';
import { useSelector, shallowEqual } from 'react-redux';
import { peerSelector } from '../selector';

interface IStateProps {
  ts: ISharedStrings;
}
interface IRecordProps {
  users: User[];
  groups: Group[];
  memberships: GroupMembership[];
}
interface IProps extends IStateProps, IRecordProps {
  org: boolean;
  initGroup?: string;
  required: boolean;
  disabled: boolean;
  label?: string;
  groupId?: string;
  onChange: (groupValue: string, groupId?: string) => void;
}

export const SelectPeerGroup = (props: IProps) => {
  const {
    users,
    groups,
    memberships,
    onChange,
    initGroup,
    required,
    disabled,
    label,
    groupId,
  } = props;
  const { peerGroups } = usePeerGroups({ users, groups, memberships });
  const [groupValue, setGroupValue] = useState(initGroup);
  const t = useSelector(peerSelector, shallowEqual) as IPeerStrings;

  const handleRoleChange = (e: any) => {
    setGroupValue(e.target.value);
    onChange && onChange(e.target.value, groupId);
  };

  useEffect(() => {
    setGroupValue(initGroup);
  }, [initGroup]);

  return (
    <TextField
      id={'select-peer-group' + (groupId || '')}
      sx={{ mx: 1, display: 'flex', flexGrow: 1, minWidth: '8rem' }}
      select
      label={t.peerGroup}
      value={groupValue}
      onChange={handleRoleChange}
      helperText={label || ''}
      margin="normal"
      variant="filled"
      required={required}
      disabled={disabled}
    >
      {peerGroups
        .sort((i, j) => (i.attributes.name <= j.attributes.name ? -1 : 1))
        .map((option: Group) => (
          <MenuItem key={option.id} value={option.id}>
            {option.attributes.name}
          </MenuItem>
        ))}
    </TextField>
  );
};

const mapRecordsToProps = {
  users: (q: QueryBuilder) => q.findRecords('user'),
  memberships: (q: QueryBuilder) => q.findRecords('groupmembership'),
  groups: (q: QueryBuilder) => q.findRecords('group'),
};

export default withData(mapRecordsToProps)(SelectPeerGroup) as any;
