import React, { useState, useEffect } from 'react';
import { useGlobal } from 'reactn';
import { connect } from 'react-redux';
import {
  IState,
  Role,
  Invitation,
  IInviteStrings,
  Group,
  RoleNames,
  User,
  Project,
} from '../model';
import localStrings from '../selector/localize';
import { withData } from 'react-orbitjs';
import { QueryBuilder, TransformBuilder } from '@orbit/data';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import {
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Typography,
  Grid,
  FormLabel,
  Checkbox,
  FormControlLabel,
  ListItem,
  ListItemText,
} from '@material-ui/core';
import SnackBar from './SnackBar';
import {
  validateEmail,
  related,
  getRoleId,
  IsAdmin,
  getUserById,
} from '../utils';
import { schema } from '../schema';
import { AUTH_CONFIG } from '../auth/auth0-variables';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    menu: {},
    label: { marginTop: theme.spacing(1) },
    container: {
      display: 'flex',
      flexWrap: 'wrap',
    },
    root: {
      flexGrow: 1,
    },
    paper: {
      padding: theme.spacing(2),
      textAlign: 'center',
      color: theme.palette.text.secondary,
    },
    textField: {
      marginLeft: theme.spacing(1),
      marginRight: theme.spacing(1),
      display: 'flex',
      flexGrow: 1,
    },
    textarea: {},
  })
);

interface IStateProps {
  t: IInviteStrings;
}

interface IRecordProps {
  roles: Array<Role>;
  groups: Array<Group>;
  users: Array<User>;
  projects: Array<Project>;
}

export interface IInviteData {
  email: string;
  role: string;
  group: string;
  groupRole: string;
  allUsersRole: string;
}

interface IProps extends IRecordProps, IStateProps {
  inviteIn: IInviteData | null;
  visible: boolean;
  addCompleteMethod?: (inviteRec: IInviteData) => void;
  editCompleteMethod?: (inviteRec: IInviteData) => void;
  cancelMethod?: () => void;
}

function Invite(props: IProps) {
  const {
    t,
    visible,
    roles,
    groups,
    users,
    projects,
    addCompleteMethod,
    editCompleteMethod,
    cancelMethod,
    inviteIn,
  } = props;
  const classes = useStyles();
  const [memory] = useGlobal('memory');
  const [organization] = useGlobal('organization');
  const [user] = useGlobal('user');
  const [currentUser, setcurrentUser] = useState('');
  const [open, setOpen] = useState(visible);
  const [email, setEmail] = useState('');
  const [emailHelp, setEmailHelp] = useState(<></>);
  const [role, setRole] = useState('');
  const [group, setGroup] = useState('');
  const [groupRole, setGroupRole] = useState('');
  const [allUsersGroup, setAllUsersGroup] = useState('');
  const [allUsersRole, setAllUsersRole] = useState('');
  const [groupsAllonly, setGroupsAllonly] = useState<Group[]>();
  const [groupsNoAll, setGroupsNoAll] = useState<Group[]>();
  const [allUsersProjects, setAllUsersProjects] = useState('');
  const [otherProjects, setOtherProjects] = useState('');
  const [message, setMessage] = useState(<></>);
  const [allowMultiple, setallowMultiple] = useState(false);

  const resetFields = () => {
    setEmail('');
    setRole(getRoleId(roles, RoleNames.Member));
    setGroup('');
    setGroupRole('');
    setAllUsersRole(getRoleId(roles, RoleNames.Transcriber));
  };
  const handleAdd = async () => {
    const strings = {
      SILOrg: t.sil,
      App: t.silTranscriber,
      Invitation: t.invitation,
      Instructions: t.instructions,
      Subject: t.emailsubject,
      Questions: t.questions,
      Join: t.join,
    };
    const link =
      IsAdmin(roles, role) ||
      IsAdmin(roles, allUsersRole) ||
      IsAdmin(roles, groupRole)
        ? AUTH_CONFIG.adminEndpoint
        : AUTH_CONFIG.appEndpoint;
    const invitedBy = currentUser;
    let invitation: Invitation = {
      type: 'invitation',
      attributes: {
        email: email,
        accepted: false,
        loginLink: link,
        invitedBy: invitedBy,
        strings: JSON.stringify(strings),
      },
    } as any;
    schema.initializeRecord(invitation);

    await memory.update((t: TransformBuilder) => [
      t.addRecord(invitation),
      t.replaceRelatedRecord(
        { type: 'invitation', id: invitation.id },
        'organization',
        {
          type: 'organization',
          id: organization,
        }
      ),
      t.replaceRelatedRecord(
        { type: 'invitation', id: invitation.id },
        'role',
        {
          type: 'role',
          id: role,
        }
      ),
      t.replaceRelatedRecord(
        { type: 'invitation', id: invitation.id },
        'allUsersRole',
        {
          type: 'role',
          id: allUsersRole,
        }
      ),
      t.replaceRelatedRecord(
        { type: 'invitation', id: invitation.id },
        'group',
        {
          type: 'group',
          id: group,
        }
      ),
      t.replaceRelatedRecord(
        { type: 'invitation', id: invitation.id },
        'groupRole',
        {
          type: 'role',
          id: groupRole,
        }
      ),
    ]);
  };
  const handleEdit = async () => {
    /* not implemented */
  };

  const handleAddOrSave = () => {
    if (!inviteIn || email !== inviteIn.email) {
      if (!inviteIn) {
        handleAdd();
        if (addCompleteMethod) {
          addCompleteMethod({
            email,
            role,
            group,
            groupRole,
            allUsersRole,
          });
        }
        resetFields();
      } else {
        handleEdit();
        if (editCompleteMethod) {
          editCompleteMethod({
            email,
            role,
            group,
            groupRole,
            allUsersRole,
          });
        }
      }
    }
    setOpen(false);
  };
  const handleCancel = () => {
    resetFields();
    if (cancelMethod) {
      cancelMethod();
    }
    setOpen(false);
  };
  const handleEmailChange = (e: any) => {
    setEmail(e.target.value);
  };
  const handleRoleChange = (e: any) => {
    setRole(e.target.value);
  };
  const handleAllUsersRoleChange = (e: any) => {
    setAllUsersRole(e.target.value);
  };
  const handleGroupChange = (e: any) => {
    setGroup(e.target.value);
    var assocProjects = projects
      .filter(p => related(p, 'group') === e.target.value)
      .map(p => p.attributes.name);
    var list = '';
    assocProjects.forEach(p => (list += p + ', '));
    setOtherProjects(
      assocProjects.length > 0
        ? list.substring(0, list.length - 2)
        : t.noProjects
    );
  };
  const handleGroupRoleChange = (e: any) => {
    setGroupRole(e.target.value);
  };
  const handleMessageReset = () => {
    setMessage(<></>);
  };
  const hasInvite = (email: string) => {
    const selectInvite: Invitation[] = memory.cache.query((q: QueryBuilder) =>
      q.findRecords('invitation').filter({ attribute: 'email', value: email })
    ) as any;
    const checkOrg =
      selectInvite &&
      selectInvite.filter(i => related(i, 'organization') === organization);
    return checkOrg && checkOrg.length > 0;
  };

  useEffect(() => {
    if (user !== '') {
      let cur = getUserById(users, user);
      setcurrentUser(
        cur && cur.attributes
          ? cur.attributes.name + ' (' + cur.attributes.email + ')'
          : '??'
      );
    }
  }, [user, users]);

  useEffect(() => {
    const allusersgroup = groups.filter(
      g =>
        g.attributes &&
        g.attributes.allUsers &&
        related(g, 'owner') === organization
    );
    setGroupsAllonly(allusersgroup);
    setAllUsersGroup(allusersgroup.length > 0 ? allusersgroup[0].id : '');
    var assocProjects = projects
      .filter(p => related(p, 'group') === allusersgroup[0].id)
      .map(p => p.attributes.name);
    var list = '';
    assocProjects.forEach(p => (list += p + ', '));
    setAllUsersProjects(
      assocProjects.length > 0
        ? list.substring(0, list.length - 2)
        : t.noProjects
    );
    const noallgroups = groups
      .filter(
        g =>
          g.attributes &&
          !g.attributes.allUsers &&
          related(g, 'owner') === organization
      )
      .sort((i, j) => (i.attributes.name < j.attributes.name ? -1 : 1));
    setGroupsNoAll(noallgroups);

    if (inviteIn) {
      setEmail(inviteIn.email);
      setRole(inviteIn.role);
      setAllUsersRole(inviteIn.allUsersRole);
      setGroup(inviteIn.group);
      setGroupRole(inviteIn.groupRole);
    } else {
      resetFields();
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [inviteIn, groups]);

  useEffect(() => {
    setOpen(visible);
  }, [visible]);

  useEffect(() => {
    setEmailHelp(
      email === '' || validateEmail(email) ? (
        hasInvite(email) ? (
          <Typography color="secondary">{t.alreadyInvited}</Typography>
        ) : (
          <></>
        )
      ) : (
        <Typography color="secondary">{t.invalidEmail}</Typography>
      )
    );
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [email]);

  return (
    <div>
      <Dialog
        open={open}
        onClose={handleCancel}
        aria-labelledby="form-dialog-title"
        maxWidth="lg"
      >
        <DialogTitle id="form-dialog-title">
          {inviteIn ? t.editInvite : t.addInvite}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={0}>
            <Grid item xs={12}>
              <FormLabel>{t.newInviteTask}</FormLabel>
            </Grid>
            <Grid item xs={12}>
              <TextField
                className={classes.textField}
                autoFocus
                margin="dense"
                variant="filled"
                id="email"
                label={t.email}
                value={email}
                onChange={handleEmailChange}
                helperText={emailHelp}
                required
              />
            </Grid>
            {hasInvite(email) && (
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={allowMultiple}
                      onChange={event => setallowMultiple(event.target.checked)}
                      value="allowMultiple"
                    />
                  }
                  label={t.resend}
                />
              </Grid>
            )}
            <Grid item xs={12}>
              <FormLabel>{t.organization}</FormLabel>
            </Grid>
            <Grid item xs={12}>
              <TextField
                id="select-role"
                className={classes.textField}
                select
                label={t.role}
                value={role}
                onChange={handleRoleChange}
                SelectProps={{
                  MenuProps: {
                    className: classes.menu,
                  },
                }}
                helperText={t.selectOrgRole}
                margin="normal"
                variant="filled"
                required
              >
                {roles
                  .filter(r => r.attributes && r.attributes.orgRole)
                  .sort((i, j) =>
                    i.attributes.roleName < j.attributes.roleName ? -1 : 1
                  )
                  .map((option: Role) => (
                    <MenuItem key={option.id} value={option.id}>
                      {option.attributes.roleName}
                    </MenuItem>
                  ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <FormLabel>{t.groups}</FormLabel>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                id="select-allgroup"
                className={classes.textField}
                select
                label={t.group}
                value={allUsersGroup}
                SelectProps={{
                  MenuProps: {
                    className: classes.menu,
                  },
                }}
                helperText={t.allusersgroup}
                margin="normal"
                variant="filled"
                required
              >
                {groupsAllonly
                  ? groupsAllonly.map((option: Group) => (
                      <MenuItem key={option.id} value={option.id}>
                        {option.attributes.name}
                      </MenuItem>
                    ))
                  : ''}
              </TextField>
            </Grid>
            <Grid item xs={6} sm={4}>
              <TextField
                id="select-allusersrole"
                className={classes.textField}
                select
                label={t.groupRole}
                value={allUsersRole}
                onChange={handleAllUsersRoleChange}
                SelectProps={{
                  MenuProps: {
                    className: classes.menu,
                  },
                }}
                helperText={t.allusersgroup && t.role}
                margin="normal"
                variant="filled"
                required
              >
                {roles
                  .filter(r => r.attributes && r.attributes.groupRole)
                  .sort((i, j) =>
                    i.attributes.roleName < j.attributes.roleName ? -1 : 1
                  )
                  .map((option: Role) => (
                    <ListItem key={option.id} value={option.id}>
                      <ListItemText
                        primary={t.getString(
                          option.attributes.roleName.toLowerCase()
                        )}
                        secondary={t.getString(
                          option.attributes.roleName.toLowerCase() + 'Detail'
                        )}
                      />
                    </ListItem>
                  ))}
              </TextField>
            </Grid>
            <Grid item xs={6} sm={4}>
              <label id="projectsAll" className={classes.label}>
                {t.allUsersProjects}
              </label>
              <div>{allUsersProjects}</div>
              <br />
            </Grid>
            {groupsNoAll && groupsNoAll.length > 0 && (
              <>
                <Grid item xs={12} sm={4}>
                  <TextField
                    id="select-group"
                    className={classes.textField}
                    select
                    label={t.group}
                    value={group}
                    onChange={handleGroupChange}
                    SelectProps={{
                      MenuProps: {
                        className: classes.menu,
                      },
                    }}
                    helperText={t.additionalgroup}
                    margin="normal"
                    variant="filled"
                  >
                    {groupsNoAll.map((option: Group) => (
                      <MenuItem key={option.id} value={option.id}>
                        {option.attributes.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={6} sm={4}>
                  <TextField
                    id="select-grouprole"
                    className={classes.textField}
                    select
                    label={t.groupRole}
                    value={groupRole}
                    onChange={handleGroupRoleChange}
                    SelectProps={{
                      MenuProps: {
                        className: classes.menu,
                      },
                    }}
                    helperText={t.selectGroupRole}
                    margin="normal"
                    variant="filled"
                    disabled={group === ''}
                  >
                    {roles
                      .filter(r => r.attributes && r.attributes.groupRole)
                      .sort((i, j) =>
                        i.attributes.roleName < j.attributes.roleName ? -1 : 1
                      )
                      .map((option: Role) => (
                        <ListItem key={option.id} value={option.id}>
                          <ListItemText
                            primary={t.getString(
                              option.attributes.roleName.toLowerCase()
                            )}
                            secondary={t.getString(
                              option.attributes.roleName.toLowerCase() +
                                'Detail'
                            )}
                          />
                        </ListItem>
                      ))}
                  </TextField>
                </Grid>
                <Grid item xs={6} sm={4}>
                  <label id="projectsAllOther" className={classes.label}>
                    {t.otherGroupProjects}
                  </label>
                  <div>{otherProjects}</div>
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancel} variant="outlined" color="primary">
            {t.cancel}
          </Button>
          <Button
            onClick={handleAddOrSave}
            variant="contained"
            color="primary"
            disabled={
              email === '' ||
              role === '' ||
              !validateEmail(email) ||
              (hasInvite(email) && !allowMultiple)
            }
          >
            {!inviteIn ? t.send : t.save}
          </Button>
        </DialogActions>
      </Dialog>
      <SnackBar {...props} message={message} reset={handleMessageReset} />
    </div>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'invite' }),
});

const mapRecordsToProps = {
  roles: (q: QueryBuilder) => q.findRecords('role'),
  groups: (q: QueryBuilder) => q.findRecords('group'),
  users: (q: QueryBuilder) => q.findRecords('user'),
  projects: (q: QueryBuilder) => q.findRecords('project'),
};

export default withData(mapRecordsToProps)(
  connect(mapStateToProps)(Invite) as any
) as any;
