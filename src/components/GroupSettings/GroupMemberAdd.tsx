import React, { useState } from 'react';
import { useGlobal } from 'reactn';
import { connect } from 'react-redux';
import {
  IState,
  GroupMembership,
  IGroupSettingsStrings,
  RoleNames,
  ISharedStrings,
} from '../../model';
import localStrings from '../../selector/localize';
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
} from '@mui/material';
import { useSnackBar } from '../../hoc/SnackBar';
import { OptionType } from '../../model';
import { menuProps } from './GroupSettingsStyles';
import { addGroupMember, useRole } from '../../crud';
import { UpdateRelatedRecord } from '../../model/baseModel';
import { localizeRole } from '../../utils';

interface IStateProps {
  t: IGroupSettingsStrings;
  ts: ISharedStrings;
}

interface IProps extends IStateProps {
  open: boolean;
  role: string;
  orgPeople: OptionType[];
  setOpen: (val: boolean) => void;
}

function GroupMemberAdd(props: IProps) {
  const { open, role, orgPeople, t, ts, setOpen } = props;
  const [memory] = useGlobal('memory');
  const [user] = useGlobal('user');
  const [group] = useGlobal('group');
  const { getRoleId } = useRole();
  const [currentPerson, setCurrentPerson] = useState<string | null>(null);
  const { showMessage } = useSnackBar();
  const inProcess = React.useRef<boolean>(false);

  const handleCommit = (e: any) => {
    setCurrentPerson(e.target.value);
  };

  const handleCancel = () => {
    setCurrentPerson(null);
    setOpen(false);
  };

  const handleAddMember = async () => {
    inProcess.current = true;
    const fileRole: RoleNames =
      role === 'owner' ? RoleNames.Admin : (role as RoleNames);
    const roleId = getRoleId(fileRole);
    //NET6 This works only because it is going to the cache. Online query would use an OR
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
        UpdateRelatedRecord(t, groupMemberRec, 'role', 'role', roleId, user)
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
      showMessage(t.allReviewersCanTranscribe);
    }
    inProcess.current = false;
    setCurrentPerson(null);
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      aria-labelledby="memberDlg"
      disableEnforceFocus
    >
      <DialogTitle id="memberDlg">
        {t.addGroupMember.replace('{0}', localizeRole(role, ts, true))}
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          {t.addMemberInstruction.replace('{0}', localizeRole(role, ts, true))}
        </DialogContentText>
        <TextField
          id="choos-group-member"
          select
          value={currentPerson}
          sx={menuProps}
          onChange={handleCommit}
          SelectProps={{ MenuProps: { sx: menuProps } }}
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
        <Button
          id="memberCancel"
          variant="outlined"
          onClick={handleCancel}
          color="primary"
        >
          {t.cancel}
        </Button>
        <Button
          id="memberAdd"
          variant="outlined"
          onClick={handleAddMember}
          color="primary"
          disabled={!currentPerson || inProcess.current}
        >
          {t.add}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'groupSettings' }),
  ts: localStrings(state, { layout: 'shared' }),
});

export default connect(mapStateToProps)(GroupMemberAdd) as any;
