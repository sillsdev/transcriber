import React, { useState, useEffect } from 'react';
import { useGlobal } from 'reactn';
import { connect } from 'react-redux';
import {
  IState,
  Role,
  Invitation,
  IInviteStrings,
  ISharedStrings,
  IGroupSettingsStrings,
  Group,
  RoleNames,
  User,
  Project,
} from '../model';
import localStrings from '../selector/localize';
import { withData } from '../mods/react-orbitjs';
import { QueryBuilder, TransformBuilder } from '@orbit/data';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import {
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  Grid,
  FormLabel,
  Checkbox,
  FormControlLabel,
} from '@material-ui/core';
import { related, useRole, getUserById } from '../crud';
import { validateEmail } from '../utils';
import { API_CONFIG } from '../api-variable';
import { AddRecord, ReplaceRelatedRecord } from '../model/baseModel';
import SelectRole from '../control/SelectRole';

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
  t: IInviteStrings;
  ts: ISharedStrings;
  tg: IGroupSettingsStrings;
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
  const { getRoleId } = useRole();
  const [currentUser, setcurrentUser] = useState('');
  const [open, setOpen] = useState(visible);
  const [email, setEmail] = useState('');
  const [emailHelp, setEmailHelp] = useState(<></>);
  const [role, setRole] = useState('');
  const [group, setGroup] = useState('');
  const [groupRole, setGroupRole] = useState('');
  const [allUsersRole, setAllUsersRole] = useState('');
  const [allUsersProjects, setAllUsersProjects] = useState('');
  const [allowMultiple, setallowMultiple] = useState(false);

  const resetFields = () => {
    setEmail('');
    setRole(getRoleId(RoleNames.Member));
    setGroup('');
    setGroupRole('');
    setAllUsersRole(getRoleId(RoleNames.Transcriber));
  };
  const handleAdd = async () => {
    const strings = {
      SILOrg: t.sil,
      App: API_CONFIG.productName,
      Invitation: t.invitation,
      Instructions: t.instructions,
      Subject: t.emailsubject.replace('{0}', API_CONFIG.productName),
      Questions: t.questions,
      Join: t.join,
    };
    const invitedBy = currentUser;
    let invitation: Invitation = {
      type: 'invitation',
      attributes: {
        email: email,
        accepted: false,
        loginLink: API_CONFIG.endpoint,
        invitedBy: invitedBy,
        strings: JSON.stringify(strings),
      },
    } as any;
    await memory.update((t: TransformBuilder) => [
      ...AddRecord(t, invitation, user, memory),
      ...ReplaceRelatedRecord(
        t,
        invitation,
        'organization',
        'organization',
        organization
      ),
      ...ReplaceRelatedRecord(t, invitation, 'role', 'role', role),
      ...ReplaceRelatedRecord(
        t,
        invitation,
        'allUsersRole',
        'role',
        allUsersRole
      ),
      ...ReplaceRelatedRecord(t, invitation, 'group', 'group', group),
      ...ReplaceRelatedRecord(t, invitation, 'groupRole', 'role', groupRole),
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
  const handleRoleChange = (e: string, rowid: string) => {
    setRole(e);
  };
  const handleAllUsersRoleChange = (e: string, rowid: string) => {
    setAllUsersRole(e);
  };
  const hasInvite = (email: string) => {
    const selectInvite: Invitation[] = memory.cache.query((q: QueryBuilder) =>
      q.findRecords('invitation').filter({ attribute: 'email', value: email })
    ) as any;
    const checkOrg =
      selectInvite &&
      selectInvite.filter((i) => related(i, 'organization') === organization);
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
      (g) =>
        g.attributes &&
        g.attributes.allUsers &&
        related(g, 'owner') === organization
    );
    if (allusersgroup.length > 0) {
      var assocProjects = projects
        .filter((p) => related(p, 'group') === allusersgroup[0].id)
        .map((p) => p.attributes.name);
      setAllUsersProjects(
        assocProjects.length > 0 ? assocProjects.join(', ') : t.noProjects
      );
    }

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
        aria-labelledby="inviteDlg"
        maxWidth="lg"
      >
        <DialogTitle id="inviteDlg">
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
                      onChange={(event) =>
                        setallowMultiple(event.target.checked)
                      }
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
              <SelectRole
                org={true}
                initRole={role}
                onChange={handleRoleChange}
                required={true}
              />
            </Grid>
            <Grid item xs={12}>
              <FormLabel>{t.groups}</FormLabel>
            </Grid>
            <Grid item xs={12} sm={6}>
              <SelectRole
                org={false}
                initRole={allUsersRole}
                onChange={handleAllUsersRoleChange}
                required={true}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <label id="projectsAll" className={classes.label}>
                {t.allUsersProjects}
              </label>
              <div>{allUsersProjects}</div>
              <br />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button
            id="inviteCancel"
            onClick={handleCancel}
            variant="outlined"
            color="primary"
          >
            {t.cancel}
          </Button>
          <Button
            id="inviteSave"
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
    </div>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'invite' }),
  ts: localStrings(state, { layout: 'shared' }),
  tg: localStrings(state, { layout: 'groupSettings' }),
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
