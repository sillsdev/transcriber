import { MenuItem, TextField } from '@mui/material';
import { useEffect, useState } from 'react';
import { IPeerStrings, Group } from '../model';
import { usePeerGroups } from '../components/Peers/usePeerGroups';
import { useSelector, shallowEqual } from 'react-redux';
import { peerSelector } from '../selector';

interface IProps {
  id?: string;
  org: boolean;
  initGroup?: string;
  required?: boolean;
  disabled?: boolean;
  label?: string;
  groupId?: string;
  onChange: (groupValue: string, groupId?: string) => void;
}

export const SelectPeerGroup = (props: IProps) => {
  const { onChange, initGroup, required, disabled, label, groupId } = props;
  const { id: idIn } = props;
  const { peerGroups } = usePeerGroups();
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
      id={idIn || 'select-peer-group' + (groupId || '')}
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

export default SelectPeerGroup;
