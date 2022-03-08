import { MenuItem, TextField } from '@material-ui/core';
import { useEffect, useState } from 'react';
import { ISharedStrings, IState, OrganizationMembership, User } from '../model';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import { QueryBuilder } from '@orbit/data';
import { useGlobal } from 'reactn';
import { withData } from '../mods/react-orbitjs';
import localStrings from '../selector/localize';
import { connect } from 'react-redux';
import { related } from '../crud';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    menu: {},
    label: { marginTop: theme.spacing(1) },
    textField: {
      marginLeft: theme.spacing(1),
      marginRight: theme.spacing(1),
      display: 'flex',
      flexGrow: 1,
      overflow: 'hidden',
      textOverflow: 'ellipse',
    },
  })
);
interface IStateProps {
  ts: ISharedStrings;
}
interface IRecordProps {
  users: Array<User>;
  orgmems: Array<OrganizationMembership>;
}
interface IProps extends IStateProps, IRecordProps {
  initUser?: string;
  label?: string;
  onChange: (role: string) => void;
  required?: boolean;
}
export const SelectUser = (props: IProps) => {
  const { ts, users, orgmems, onChange, initUser, required, label } = props;
  const classes = useStyles();
  const [offlineOnly] = useGlobal('offlineOnly');
  const [organization] = useGlobal('organization');
  const [orgUsers, setOrgUsers] = useState<User[]>([]);
  const [role, setUser] = useState(initUser);

  const handleUserChange = (e: any) => {
    setUser(e.target.value);
    onChange && onChange(e.target.value);
  };

  useEffect(() => {
    setUser(initUser);
  }, [initUser]);

  useEffect(() => {
    var orgusers = orgmems
      .filter((om) => related(om, 'organization') === organization)
      .map((om) => related(om, 'user'));
    setOrgUsers(
      users
        .filter(
          (u) =>
            u.attributes &&
            Boolean(u?.keys?.remoteId) !== offlineOnly &&
            orgusers.includes(u.id)
        )
        .sort((i, j) =>
          (i.attributes.familyName || '') < (j.attributes.familyName || '')
            ? -1
            : (i.attributes.familyName || '') > (j.attributes.familyName || '')
            ? 1
            : (i.attributes.givenName || '') <= (j.attributes.givenName || '')
            ? -1
            : 1
        )
    );
  }, [organization, users, orgmems, offlineOnly]);

  return (
    <TextField
      id="select-user"
      className={classes.textField}
      select
      label={ts.user}
      value={role}
      onChange={handleUserChange}
      SelectProps={{
        MenuProps: {
          className: classes.menu,
        },
      }}
      helperText={label || ts.user}
      margin="normal"
      variant="filled"
      required={required}
    >
      {orgUsers.map((option: User) => (
        <MenuItem key={option.id} value={option.id}>
          {`${option.attributes.name} ${option.attributes.email}`}
        </MenuItem>
      ))}
    </TextField>
  );
};
const mapStateToProps = (state: IState): IStateProps => ({
  ts: localStrings(state, { layout: 'shared' }),
});

const mapRecordsToProps = {
  users: (q: QueryBuilder) => q.findRecords('user'),
  orgmems: (q: QueryBuilder) => q.findRecords('organizationmembership'),
};

export default withData(mapRecordsToProps)(
  connect(mapStateToProps)(SelectUser) as any
) as any;
