import { MenuItem, TextField } from '@material-ui/core';
import { useEffect, useState } from 'react';
import { ISharedStrings, IState, Role } from '../model';
import { localizeRole } from '../utils';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import { QueryBuilder } from '@orbit/data';
import { useGlobal } from 'reactn';
import { withData } from '../mods/react-orbitjs';
import localStrings from '../selector/localize';
import { connect } from 'react-redux';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    menu: {},
    label: { marginTop: theme.spacing(1) },
    textField: {
      marginLeft: theme.spacing(1),
      marginRight: theme.spacing(1),
      display: 'flex',
      flexGrow: 1,
    },
  })
);
interface IStateProps {
  ts: ISharedStrings;
}
interface IRecordProps {
  roles: Array<Role>;
}
interface IProps extends IStateProps, IRecordProps {
  org: boolean;
  initRole?: string;
  required: boolean;
  disabled: boolean;
  label?: string;
  rowid?: string;
  onChange: (role: string, rowid?: string) => void;
}
export const SelectRole = (props: IProps) => {
  const {
    ts,
    roles,
    org,
    onChange,
    initRole,
    required,
    disabled,
    label,
    rowid,
  } = props;
  const classes = useStyles();
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
      id={(org ? 'selectteamrole' : 'selectprojectrole') + (rowid || '')}
      className={classes.textField}
      select
      label={org ? ts.teamrole : ts.projectrole}
      value={role}
      onChange={handleRoleChange}
      SelectProps={{
        MenuProps: {
          className: classes.menu,
        },
      }}
      helperText={label || ''}
      margin="normal"
      variant="filled"
      required={required}
      disabled={disabled}
    >
      {roles
        .filter(
          (r) =>
            r.attributes &&
            (org ? r.attributes.orgRole : r.attributes.groupRole) &&
            Boolean(r?.keys?.remoteId) !== offlineOnly
        )
        .map((r) => ({
          ...r,
          attributes: {
            ...r.attributes,
            roleName: localizeRole(r.attributes.roleName, ts, !org),
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
