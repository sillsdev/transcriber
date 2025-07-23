import React, { useState, useEffect } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { shallowEqual, useSelector } from 'react-redux';
import {
  Invitation,
  IInviteStrings,
  Group,
  RoleNames,
  User,
  Project,
  InvitationD,
  OrganizationMembershipD,
} from '../model';
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
  styled,
} from '@mui/material';
import { related, useRole, getUserById } from '../crud';
import { validateEmail, validateMultipleEmails } from '../utils';
import { API_CONFIG } from '../api-variable';
import { AddRecord, ReplaceRelatedRecord } from '../model/baseModel';
import SelectRole from '../control/SelectRole';
import { inviteSelector } from '../selector';
import { useOrbitData } from '../hoc/useOrbitData';
import { InitializedRecord } from '@orbit/records';

const StyledLabel = styled('label')(({ theme }) => ({
  marginTop: theme.spacing(1),
}));

export interface IInviteData {
  email: string;
  role: string;
}

interface IProps {
  inviteIn: IInviteData | null;
  visible: boolean;
  addCompleteMethod?: (inviteRec: IInviteData) => void;
  editCompleteMethod?: (inviteRec: IInviteData) => void;
  cancelMethod?: () => void;
}

function Invite(props: IProps) {
  const {
    visible,
    addCompleteMethod,
    editCompleteMethod,
    cancelMethod,
    inviteIn,
  } = props;
  const projects = useOrbitData<Project[]>('project');
  const groups = useOrbitData<Group[]>('group');
  const users = useOrbitData<User[]>('user');
  const invitations = useOrbitData<InvitationD[]>('invitation');
  const members = useOrbitData<OrganizationMembershipD[]>(
    'organizationmembership'
  );
  const [isDeveloper] = useGlobal('developer');
  const [memory] = useGlobal('memory');
  const [organization] = useGlobal('organization');
  const [user] = useGlobal('user');
  const { getRoleId } = useRole();
  const [currentUser, setcurrentUser] = useState('');
  const [open, setOpen] = useState(visible);
  const [email, setEmail] = useState('');
  const [emailHelp, setEmailHelp] = useState(<></>);
  const [role, setRole] = useState('');
  const [allUsersProjects, setAllUsersProjects] = useState('');
  const [allowMultiple, setallowMultiple] = useState(false);
  const t: IInviteStrings = useSelector(inviteSelector, shallowEqual);

  const resetFields = () => {
    setEmail('');
    setRole(getRoleId(RoleNames.Member));
  };
  const handleAdd = async () => {
    const strings = {
      SILOrg: require('../../package.json').author.name,
      App: API_CONFIG.productName,
      Invitation: t.invitation,
      Instructions: t.instructions,
      Subject: t.emailsubject.replace('{0}', API_CONFIG.productName),
      Questions: t.questions,
      Join: t.join,
    };
    const invitedBy = currentUser;
    let invitations: Invitation[] = email.split(';').map(
      (emailPart) =>
        ({
          type: 'invitation',
          attributes: {
            email: emailPart.trim().toLowerCase(),
            accepted: false,
            loginLink: API_CONFIG.endpoint,
            invitedBy: invitedBy,
            strings: JSON.stringify(strings),
          },
        } as any)
    );
    for (const invitation of invitations) {
      await memory.update((t) => [
        ...AddRecord(t, invitation, user, memory),
        ...ReplaceRelatedRecord(
          t,
          invitation as InitializedRecord,
          'organization',
          'organization',
          organization
        ),
        ...ReplaceRelatedRecord(
          t,
          invitation as InitializedRecord,
          'role',
          'role',
          role
        ),
        ...ReplaceRelatedRecord(
          t,
          invitation as InitializedRecord,
          'allUsersRole',
          'role',
          role
        ),
      ]);
    }
  };
  const handleEdit = async () => {
    /* not implemented */
  };

  const handleAddOrSave = () => {
    if (!inviteIn || email !== inviteIn.email) {
      if (!inviteIn) {
        handleAdd();
        if (addCompleteMethod) {
          for (const emailPart of email.split(';')) {
            addCompleteMethod({
              email: emailPart.trim().toLowerCase(),
              role,
            });
          }
        }
        resetFields();
      } else {
        handleEdit();
        if (editCompleteMethod) {
          editCompleteMethod({
            email,
            role,
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
    const email = e.target.value as string;
    setEmail(email.toLowerCase());
  };
  const handleRoleChange = (e: string, rowid?: string) => {
    setRole(e);
  };

  const orgEmails = React.useMemo(() => {
    const orgUserIds = members
      .filter((m) => related(m, 'organization') === organization)
      .map((m) => related(m, 'user'));
    return users
      .filter((u) => orgUserIds.includes(u.id))
      .map((u) => u.attributes.email.trim().toLowerCase());
  }, [members, users, organization]);

  const hasInviteForEmail = (email: string) => {
    return (
      invitations.some(
        (invitation) =>
          invitation?.attributes?.email?.trim()?.toLowerCase() === email &&
          related(invitation, 'organization') === organization
      ) ||
      orgEmails.includes(email) ||
      false
    );
  };

  const hasInvite = (emails: string) => {
    const emailList = emails.split(';').map((e) => e.trim().toLowerCase());
    const emailSet = new Set(emailList);
    if (emailSet.size !== emailList.length) {
      // Duplicate emails found
      return true;
    }
    for (const email of emailList) {
      if (hasInviteForEmail(email)) {
        return true;
      }
    }
    return false;
  };

  useEffect(() => {
    if (user !== '') {
      let cur = getUserById(users, user);
      const curUser =
        cur && cur.attributes
          ? cur.attributes.name + ' (' + cur.attributes.email + ')'
          : '??';
      if (curUser !== currentUser) {
        setcurrentUser(curUser);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, users]);

  useEffect(() => {
    const allusersgroup = groups.filter(
      (g) => g?.attributes?.allUsers && related(g, 'owner') === organization
    );
    if (allusersgroup.length > 0) {
      var assocProjects = projects
        .filter((p) => related(p, 'group') === allusersgroup[0].id)
        .map((p) => p.attributes.name)
        .sort();
      const newValue =
        assocProjects.length > 0 ? assocProjects.join(', ') : t.noProjects;
      if (newValue !== allUsersProjects) {
        setAllUsersProjects(newValue);
      }
    }

    if (inviteIn) {
      if (inviteIn.email !== email) setEmail(inviteIn.email.toLowerCase());
      if (inviteIn.role !== role) setRole(inviteIn.role);
    } else {
      if (email !== '') resetFields();
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [inviteIn, groups]);

  useEffect(() => {
    setOpen(visible);
  }, [visible]);

  useEffect(() => {
    setEmailHelp(
      email === '' ||
        (!inviteIn ? validateMultipleEmails(email) : validateEmail(email)) ? (
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
        disableEnforceFocus
      >
        <DialogTitle id="inviteDlg">
          {inviteIn ? t.editInvite : t.addInvite}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={0}>
            <Grid item xs={12}>
              <FormLabel>
                {t.newInviteTask} {!inviteIn ? t.newInviteTask2 : ''}
              </FormLabel>
            </Grid>
            <Grid item xs={12}>
              <TextField
                sx={{ mx: 1, display: 'flex', flexGrow: 1 }}
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
            {isDeveloper && hasInvite(email) && (
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
                initRole={role}
                onChange={handleRoleChange}
                required={true}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <StyledLabel id="projectsAll">{t.allUsersProjects}</StyledLabel>
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
              !(!inviteIn
                ? validateMultipleEmails(email)
                : validateEmail(email)) ||
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

export default Invite;
