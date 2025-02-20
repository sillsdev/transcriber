import { MenuItem, TextField } from '@mui/material';
import { useEffect, useState } from 'react';
import { ISharedStrings, RoleD } from '../model';
import { localizeRole } from '../utils';
import { useGlobal } from '../context/GlobalContext';
import { shallowEqual, useSelector } from 'react-redux';
import { sharedSelector } from '../selector';
import { useOrbitData } from '../hoc/useOrbitData';

interface IProps {
  initRole?: string;
  required?: boolean;
  disabled?: boolean;
  label?: string;
  rowid?: string;
  onChange: (role: string, rowid?: string) => void;
}
export const SelectRole = (props: IProps) => {
  const { onChange, initRole, required, disabled, label, rowid } = props;
  const roles = useOrbitData<RoleD[]>('role');
  const ts: ISharedStrings = useSelector(sharedSelector, shallowEqual);
  const [offlineOnly] = useGlobal('offlineOnly'); //will be constant here
  const [role, setRole] = useState(initRole);

  const handleRoleChange = (e: any) => {
    setRole(e.target.value);
    onChange && onChange(e.target.value, rowid);
  };

  useEffect(() => {
    setRole(initRole);
  }, [initRole]);

  return (
    <TextField
      id={'selectteamrole' + (rowid || '')}
      sx={{ mx: 1, display: 'flex', flexGrow: 1, minWidth: '8rem' }}
      select
      label={ts.teamrole}
      value={role}
      onChange={handleRoleChange}
      helperText={label || ''}
      margin="normal"
      variant="filled"
      required={required}
      disabled={disabled}
    >
      {roles
        .filter(
          (r) =>
            r.attributes?.orgRole && Boolean(r?.keys?.remoteId) !== offlineOnly
        )
        .map((r) => ({
          ...r,
          attributes: {
            ...r.attributes,
            roleName: localizeRole(r.attributes.roleName, ts),
          },
        }))
        .sort((i, j) =>
          i.attributes.roleName <= j.attributes.roleName ? -1 : 1
        )
        .map((option) => (
          <MenuItem key={option.id} value={option.id}>
            {option.attributes.roleName}
          </MenuItem>
        ))}
    </TextField>
  );
};

export default SelectRole;
