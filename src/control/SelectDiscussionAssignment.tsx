import { MenuItem, TextField } from '@mui/material';
import { useEffect, useState } from 'react';
import {
  IDiscussionCardStrings,
  User,
  Group,
  OrganizationMembership,
} from '../model';
import { usePeerGroups } from '../components/Peers/usePeerGroups';
import { useSelector, shallowEqual } from 'react-redux';
import { discussionCardSelector } from '../selector';
import { related } from '../crud';
import { useGlobal } from '../context/GlobalContext';
import { useOrbitData } from '../hoc/useOrbitData';

interface IProps {
  id?: string;
  org: boolean;
  initAssignment?: string;
  required?: boolean;
  disabled?: boolean;
  label?: string;
  userPrefix: string;
  groupPrefix: string;
  onChange: (value: string) => void;
}

export const SelectDiscussionAssignment = (props: IProps) => {
  const {
    onChange,
    initAssignment,
    required,
    disabled,
    label,
    userPrefix,
    groupPrefix,
    id: idIn,
  } = props;
  const users = useOrbitData<User[]>('user');
  const orgmems = useOrbitData<OrganizationMembership[]>(
    'organizationmembership'
  );
  const { peerGroups } = usePeerGroups();
  const [orgUsers, setOrgUsers] = useState<User[]>([]);
  const [offlineOnly] = useGlobal('offlineOnly');
  const [organization] = useGlobal('organization');
  const [value, setValue] = useState(initAssignment);
  const t = useSelector(
    discussionCardSelector,
    shallowEqual
  ) as IDiscussionCardStrings;

  const handleAssigmentChange = (e: any) => {
    setValue(e.target.value);
    onChange && onChange(e.target.value);
  };

  useEffect(() => {
    setValue(initAssignment);
  }, [initAssignment]);

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
      id={idIn || 'selectassignment'}
      sx={{ mx: 1, display: 'flex', flexGrow: 1, minWidth: '8rem' }}
      select
      label={t.groupuser}
      value={value}
      onChange={handleAssigmentChange}
      helperText={label || ''}
      margin="normal"
      variant="filled"
      required={required}
      disabled={disabled}
    >
      {peerGroups
        .sort((i, j) => (i.attributes.name <= j.attributes.name ? -1 : 1))
        .map((option: Group) => (
          <MenuItem key={option.id} value={groupPrefix + option.id}>
            {option.attributes.name}
          </MenuItem>
        ))}
      {orgUsers.map((option: User) => (
        <MenuItem key={option.id} value={userPrefix + option.id}>
          {`${
            option.attributes.name
          } ${option.attributes.email?.toLowerCase()}`}
        </MenuItem>
      ))}
    </TextField>
  );
};

export default SelectDiscussionAssignment;
