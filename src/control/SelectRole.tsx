import { MenuItem, TextField } from '@mui/material';
import { useEffect, useState } from 'react';
import { ISharedStrings, IState, Role } from '../model';
import { localizeRole } from '../utils';
import { QueryBuilder } from '@orbit/data';
import { useGlobal } from '../mods/reactn';
import { withData } from 'react-orbitjs';
import localStrings from '../selector/localize';
import { connect } from 'react-redux';

interface IStateProps {
  ts: ISharedStrings;
}
interface IRecordProps {
  roles: Array<Role>;
}
interface IProps extends IStateProps, IRecordProps {
  initRole?: string;
  required: boolean;
  disabled: boolean;
  label?: string;
  rowid?: string;
  onChange: (role: string, rowid?: string) => void;
}
export const SelectRole = (props: IProps) => {
  const { ts, roles, onChange, initRole, required, disabled, label, rowid } =
    props;
  const [offlineOnly] = useGlobal('offlineOnly');
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
        .map((option: Role) => (
          <MenuItem key={option.id} value={option.id}>
            {option.attributes.roleName}
          </MenuItem>
        ))}
    </TextField>
  );
};
const mapStateToProps = (state: IState): IStateProps => ({
  ts: localStrings(state, { layout: 'shared' }),
});

const mapRecordsToProps = {
  roles: (q: QueryBuilder) => q.findRecords('role'),
};

export default withData(mapRecordsToProps)(
  connect(mapStateToProps)(SelectRole) as any
) as any;
