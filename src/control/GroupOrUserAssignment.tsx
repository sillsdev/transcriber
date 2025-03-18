import { MenuItem, TextField } from '@mui/material';
import { useEffect, useState } from 'react';
import { IDiscussionCardStrings, User, Group } from '../model';
import { usePeerGroups } from '../components/Peers/usePeerGroups';
import { useSelector, shallowEqual } from 'react-redux';
import { discussionCardSelector } from '../selector';
import { groupPrefix, userPrefix } from '../crud/useGroupOrUser';
import { useOrgMembers } from '../crud/useOrgMembers';

const OnlyAdmin = 'only-admin';

interface IProps {
  id?: string;
  listAdmins: boolean;
  initAssignment?: string;
  required?: boolean;
  disabled?: boolean;
  label?: string;
  team?: string;
  onChange: (value: string) => void;
}

export const GroupOrUserAssignment = (props: IProps) => {
  const {
    onChange,
    initAssignment,
    required,
    disabled,
    label,
    id: idIn,
    listAdmins,
    team,
  } = props;
  const { peerGroups } = usePeerGroups();
  const orgUsers = useOrgMembers({ team, listAdmins });
  const [value, setValue] = useState(initAssignment);
  const t = useSelector(
    discussionCardSelector,
    shallowEqual
  ) as IDiscussionCardStrings;

  const handleAssigmentChange = (e: any) => {
    const value = e.target.value !== OnlyAdmin ? e.target.value : undefined;
    setValue(value);
    onChange && onChange(value);
  };

  useEffect(() => {
    setValue(initAssignment);
  }, [initAssignment]);

  return orgUsers.length > 0 ? (
    <TextField
      id={idIn || 'selectassignment'}
      sx={{ mx: 1, display: 'flex', flexGrow: 1, minWidth: '8rem' }}
      select
      label={label || t.groupuser.replace('{0}', '')}
      value={value || (!listAdmins ? OnlyAdmin : '')}
      onChange={handleAssigmentChange}
      helperText={t.groupuser.replace(
        '{0}',
        !listAdmins ? `(${t.adminsAlways})` : ''
      )}
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
      {!listAdmins && (
        <MenuItem key="only-admin" value={OnlyAdmin}>
          {t.onlyAdmin}
        </MenuItem>
      )}
    </TextField>
  ) : (
    <></>
  );
};

export default GroupOrUserAssignment;
