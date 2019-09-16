import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import { IState, Role, IInviteStrings } from '../model';
import localStrings from '../selector/localize';
import { withData } from 'react-orbitjs';
import { QueryBuilder } from '@orbit/data';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import {
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  MenuItem,
  Typography,
} from '@material-ui/core';
import SnackBar from './SnackBar';
import { validateEmail } from '../utils';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    menu: {
      width: 200,
    },
  })
);

interface IStateProps {
  t: IInviteStrings;
}

interface IRecordProps {
  roles: Array<Role>;
}

export interface IInviteData {
  email: string;
  role: string;
}

interface IProps extends IRecordProps, IStateProps {
  inviteIn: IInviteData | null;
  visible: boolean;
  addMethod?: (groupName: string, role: string) => void;
  editMethod?: (inviteRec: any) => void;
  cancelMethod?: () => void;
}

function Invite(props: IProps) {
  const {
    t,
    visible,
    roles,
    addMethod,
    editMethod,
    cancelMethod,
    inviteIn,
  } = props;
  const classes = useStyles();
  const [open, setOpen] = useState(visible);
  const [email, setEmail] = useState('');
  const [emailHelp, setEmailHelp] = useState(<></>);
  const [role, setRole] = useState('');
  const [message, setMessage] = useState(<></>);

  const handleAddOrSave = () => {
    if (!inviteIn || email !== inviteIn.email) {
      if (!inviteIn) {
        if (addMethod) {
          addMethod(email, role);
        }
        setEmail('');
        setRole('');
      } else {
        if (editMethod) {
          editMethod({ email: email, role: role });
        }
      }
    }
    setOpen(false);
  };
  const handleCancel = () => {
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
  const handleMessageReset = () => {
    setMessage(<></>);
  };

  useEffect(() => {
    setEmail(inviteIn ? inviteIn.email : '');
    setRole(inviteIn ? inviteIn.role : '');
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [inviteIn]);

  useEffect(() => {
    setOpen(visible);
  }, [visible]);

  useEffect(() => {
    setEmailHelp(
      email === '' || validateEmail(email) ? (
        <></>
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
      >
        <DialogTitle id="form-dialog-title">
          {inviteIn ? t.editInvite : t.addInvite}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>{t.newInviteTask}</DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            variant="filled"
            id="email"
            label={t.email}
            value={email}
            onChange={handleEmailChange}
            helperText={emailHelp}
            required
            fullWidth
          />
          <TextField
            id="select-role"
            select
            label={t.role}
            value={role}
            onChange={handleRoleChange}
            SelectProps={{
              MenuProps: {
                className: classes.menu,
              },
            }}
            helperText={t.selectRole}
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
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancel} variant="outlined" color="primary">
            {t.cancel}
          </Button>
          <Button
            onClick={handleAddOrSave}
            variant="contained"
            color="primary"
            disabled={email === '' || role === '' || !validateEmail(email)}
          >
            {!inviteIn ? t.add : t.save}
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
};

export default withData(mapRecordsToProps)(connect(mapStateToProps)(
  Invite
) as any) as any;
