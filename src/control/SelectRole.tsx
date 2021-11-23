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
  label?: string;
  onChange: (role: string) => void;
}
export const SelectRole = (props: IProps) => {
  const { ts, roles, org, onChange, initRole, required, label } = props;
  const classes = useStyles();
  const [offline] = useGlobal('offline');
  const [role, setRole] = useState(initRole);

  const handleRoleChange = (e: any) => {
    setRole(e.target.value);
    onChange && onChange(e.target.value);
  };

  useEffect(() => {
    setRole(initRole);
  }, [initRole]);

  return (
    <TextField
      id={'select-role' + org ? '-team' : '-project'}
      className={classes.textField}
      select
      label={label || org ? ts.teamrole : ts.role}
      value={role}
      onChange={handleRoleChange}
      SelectProps={{
        MenuProps: {
          className: classes.menu,
        },
      }}
      helperText={label || ts.role}
      margin="normal"
      variant="filled"
      required={required}
    >
      {roles
        .filter((r) =>
          r.attributes && org
            ? r.attributes.orgRole
            : r.attributes.groupRole && Boolean(r?.keys?.remoteId) !== offline
        )
        .sort((i, j) =>
          i.attributes.roleName < j.attributes.roleName ? -1 : 1
        )
        .map((option: Role) => (
          <MenuItem key={option.id} value={option.id}>
            {localizeRole(option.attributes.roleName, ts)}
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
