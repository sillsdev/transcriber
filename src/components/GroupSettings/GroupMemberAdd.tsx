import React, { useState } from 'react';
import { useGlobal } from 'reactn';
import { connect } from 'react-redux';
import {
  IState,
  GroupMembership,
  Role,
  IGroupSettingsStrings,
  RoleNames,
} from '../../model';
import localStrings from '../../selector/localize';
import { withData } from '../../mods/react-orbitjs';
import { QueryBuilder, TransformBuilder } from '@orbit/data';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  MenuItem,
} from '@material-ui/core';
import SnackBar from '../SnackBar';
import { OptionType } from '../ReactSelect';
import useStyles from './GroupSettingsStyles';
import { getRoleId } from '../../utils';
import { addGroupMember } from '../../utils/groupmembership';

interface IStateProps {
  t: IGroupSettingsStrings;
}

interface IRecordProps {
  roles: Array<Role>;
}

interface IProps extends IStateProps, IRecordProps {
  open: boolean;
  role: string;
  orgPeople: OptionType[];
  setOpen: (val: boolean) => void;
}

function GroupMemberAdd(props: IProps) {
  const { open, role, orgPeople, t, roles, setOpen } = props;
  const classes = useStyles();
  const [memory] = useGlobal('memory');
  const [group] = useGlobal('group');
  const [currentPerson, setCurrentPerson] = useState<string | null>(null);
  const [message, setMessage] = useState(<></>);
  const inProcess = React.useRef<boolean>(false);

  const handleCommit = (e: any) => {
    setCurrentPerson(e.target.value);
  };

  const handleCancel = () => {
    setCurrentPerson(null);
    setOpen(false);
  };

  const handleMessageReset = () => setMessage(<></>);

  const handleAddMember = async () => {
    inProcess.current = true;
    const fileRole: RoleNames =
      role === 'owner' ? RoleNames.Admin : (role as RoleNames);
    const roleId = getRoleId(roles, fileRole);
    const groupMemberRecs: GroupMembership[] = memory.cache.query(
      (q: QueryBuilder) =>
        q.findRecords('groupmembership').filter(
          {
            relation: 'user',
            record: { type: 'user', id: currentPerson ? currentPerson : '' },
          },
          { relation: 'group', record: { type: 'group', id: group } }
        )
    ) as any;
    let groupMemberRec: GroupMembership;
    if (groupMemberRecs.length > 0) {
      groupMemberRec = groupMemberRecs[0];
      await memory.update((t: TransformBuilder) =>
        t.replaceRelatedRecord(
          { type: 'groupmembership', id: groupMemberRec.id },
          'role',
          { type: 'role', id: roleId }
        )
      );
    } else {
      await addGroupMember(
        memory,
        group,
        currentPerson ? currentPerson : '',
        roleId
      );
    }
    if (role === RoleNames.Editor) {
      setMessage(<span>{t.allReviewersCanTranscribe}</span>);
    }
    inProcess.current = false;
    setCurrentPerson(null);
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      aria-labelledby="form-dialog-title"
    >
      <DialogTitle id="form-dialog-title">
        {t.addGroupMember.replace(
          '{0}',
          role.toLocaleLowerCase() === 'admin' ? 'Owner' : role
        )}
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          {t.addMemberInstruction.replace(
            '{0}',
            role.toLocaleLowerCase() === 'admin'
              ? 'owner'
              : role.toLocaleLowerCase()
          )}
        </DialogContentText>
        <TextField
          id="choos-group-member"
          select
          value={currentPerson}
          className={classes.menu}
          onChange={handleCommit}
          SelectProps={{
            MenuProps: {
              className: classes.menu,
            },
          }}
          margin="normal"
          variant="filled"
          required
        >
          {orgPeople.map((option: OptionType) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={handleCancel} color="primary">
          {t.cancel}
        </Button>
        <Button
          variant="outlined"
          onClick={handleAddMember}
          color="primary"
          disabled={!currentPerson || inProcess.current}
        >
          {t.add}
        </Button>
      </DialogActions>
      <SnackBar {...props} message={message} reset={handleMessageReset} />
    </Dialog>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'groupSettings' }),
});

const mapRecordsToProps = {
  roles: (q: QueryBuilder) => q.findRecords('role'),
};

export default withData(mapRecordsToProps)(
  connect(mapStateToProps)(GroupMemberAdd) as any
) as any;
