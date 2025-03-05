import { MenuItem, TextField } from '@mui/material';
import { useEffect, useState } from 'react';
import { ISharedStrings, OrganizationMembership, User } from '../model';
import { useGlobal } from '../context/GlobalContext';
import { related } from '../crud';
import { useOrbitData } from '../hoc/useOrbitData';
import { sharedSelector } from '../selector';
import { shallowEqual, useSelector } from 'react-redux';

interface IProps {
  id?: string;
  initUser?: string;
  label?: string;
  onChange: (role: string) => void;
  required?: boolean;
}
export const SelectUser = (props: IProps) => {
  const { id: idIn, onChange, initUser, required, label } = props;
  const users = useOrbitData<User[]>('user');
  const orgmems = useOrbitData<OrganizationMembership[]>(
    'organizationmembership'
  );
  const ts: ISharedStrings = useSelector(sharedSelector, shallowEqual);
  const [offlineOnly] = useGlobal('offlineOnly'); //verified this is not used in a function 2/18/25
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
          (i.attributes?.familyName || '') < (j.attributes?.familyName || '')
            ? -1
            : (i.attributes?.familyName || '') >
              (j.attributes?.familyName || '')
            ? 1
            : (i.attributes?.givenName || '') <= (j.attributes?.givenName || '')
            ? -1
            : 1
        )
    );
  }, [organization, users, orgmems, offlineOnly]);

  return (
    <TextField
      id={idIn || 'select-user'}
      sx={{
        mx: 1,
        display: 'flex',
        flexGrow: 1,
        overflow: 'hidden',
        textOverflow: 'ellipse',
      }}
      select
      label={ts.user}
      value={role}
      onChange={handleUserChange}
      helperText={label || ts.user}
      margin="normal"
      variant="filled"
      required={required}
    >
      {orgUsers.map((option: User) => (
        <MenuItem key={option.id} value={option.id}>
          {`${option.attributes.name} ${option.attributes.email.toLowerCase()}`}
        </MenuItem>
      ))}
    </TextField>
  );
};
export default SelectUser;
