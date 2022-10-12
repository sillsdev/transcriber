import { MenuItem, TextField } from '@material-ui/core';
import { useEffect, useState } from 'react';
import {
  GroupMembership,
  ISharedStrings,
  IDiscussionCardStrings,
  User,
  Group,
  OrganizationMembership,
} from '../model';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import { QueryBuilder } from '@orbit/data';
import { withData } from '../mods/react-orbitjs';
import { usePeerGroups } from '../components/Peers/usePeerGroups';
import { useSelector, shallowEqual } from 'react-redux';
import { discussionCardSelector } from '../selector';
import { related } from '../crud';
import { useGlobal } from 'reactn';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    menu: {},
    label: { marginTop: theme.spacing(1) },
    textField: {
      marginLeft: theme.spacing(1),
      marginRight: theme.spacing(1),
      display: 'flex',
      flexGrow: 1,
      minWidth: '8rem',
    },
  })
);
interface IStateProps {
  ts: ISharedStrings;
}
interface IRecordProps {
  users: User[];
  groups: Group[];
  memberships: GroupMembership[];
  orgmems: OrganizationMembership[];
}
interface IProps extends IStateProps, IRecordProps {
  org: boolean;
  initAssignment?: string;
  required: boolean;
  disabled: boolean;
  label?: string;
  userPrefix: string;
  groupPrefix: string;
  onChange: (value: string) => void;
}

export const SelectDiscussionAssignment = (props: IProps) => {
  const {
    users,
    groups,
    memberships,
    orgmems,
    onChange,
    initAssignment,
    required,
    disabled,
    label,
    userPrefix,
    groupPrefix,
  } = props;
  const classes = useStyles();
  const { peerGroups } = usePeerGroups({ users, groups, memberships });
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
      id="selectassignment"
      className={classes.textField}
      select
      label={t.groupuser}
      value={value}
      onChange={handleAssigmentChange}
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
      {peerGroups
        .sort((i, j) => (i.attributes.name <= j.attributes.name ? -1 : 1))
        .map((option: Group) => (
          <MenuItem key={option.id} value={groupPrefix + option.id}>
            {option.attributes.name}
          </MenuItem>
        ))}
      {orgUsers.map((option: User) => (
        <MenuItem key={option.id} value={userPrefix + option.id}>
          {`${option.attributes.name} ${option.attributes.email}`}
        </MenuItem>
      ))}
    </TextField>
  );
};

const mapRecordsToProps = {
  users: (q: QueryBuilder) => q.findRecords('user'),
  memberships: (q: QueryBuilder) => q.findRecords('groupmembership'),
  groups: (q: QueryBuilder) => q.findRecords('group'),
  orgmems: (q: QueryBuilder) => q.findRecords('organizationmembership'),
};

export default withData(mapRecordsToProps)(SelectDiscussionAssignment) as any;
