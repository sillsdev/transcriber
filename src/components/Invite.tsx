import React, { useState, useEffect } from 'react';
import { useGlobal } from 'reactn';
import { shallowEqual, useSelector } from 'react-redux';
import {
  Role,
  Invitation,
  IInviteStrings,
  Group,
  RoleNames,
  User,
  Project,
} from '../model';
import { withData } from 'react-orbitjs';
import { QueryBuilder, TransformBuilder } from '@orbit/data';
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
import { validateEmail } from '../utils';
import { API_CONFIG } from '../api-variable';
import { AddRecord, ReplaceRelatedRecord } from '../model/baseModel';
import SelectRole from '../control/SelectRole';
import { inviteSelector } from '../selector';

const StyledLabel = styled('label')(({ theme }) => ({
  marginTop: theme.spacing(1),
}));

interface IRecordProps {
  roles: Array<Role>;
  groups: Array<Group>;
  users: Array<User>;
  projects: Array<Project>;
}

export interface IInviteData {
  email: string;
  role: string;
}

interface IProps extends IRecordProps {
  inviteIn: IInviteData | null;
  visible: boolean;
  addCompleteMethod?: (inviteRec: IInviteData) => void;
  editCompleteMethod?: (inviteRec: IInviteData) => void;
  cancelMethod?: () => void;
}

function Invite(props: IProps) {
  const {
    visible,
    groups,
    users,
    projects,
    addCompleteMethod,
    editCompleteMethod,
    cancelMethod,
    inviteIn,
  } = props;
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
      ...ReplaceRelatedRecord(t, invitation, 'allUsersRole', 'role', role),
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
          });
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
    setEmail(e.target.value);
  };
  const handleRoleChange = (e: string, rowid: string) => {
    setRole(e);
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
        disableEnforceFocus
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

const mapRecordsToProps = {
  roles: (q: QueryBuilder) => q.findRecords('role'),
  groups: (q: QueryBuilder) => q.findRecords('group'),
  users: (q: QueryBuilder) => q.findRecords('user'),
  projects: (q: QueryBuilder) => q.findRecords('project'),
};

export default withData(mapRecordsToProps)(Invite) as any;
