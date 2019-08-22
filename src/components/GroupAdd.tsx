import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import { IState, Group, PlanType, IGroupAddStrings } from '../model';
import localStrings from '../selector/localize';
import {
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@material-ui/core';
import SnackBar from './SnackBar';
import { makeAbbr } from '../utils';

interface IStateProps {
  t: IGroupAddStrings;
}

interface IRecordProps {
  planTypes: Array<PlanType>;
}

interface IProps extends IRecordProps, IStateProps {
  groupIn: Group | null;
  visible: boolean;
  addMethod?: (groupName: string, groupAbbr: string) => void;
  editMethod?: (groupRec: any) => void;
  cancelMethod?: () => void;
}

function GroupAdd(props: IProps) {
  const { t, visible, addMethod, editMethod, cancelMethod, groupIn } = props;
  const [open, setOpen] = useState(visible);
  const [name, setName] = useState(
    (groupIn && groupIn.attributes.name) || t.newGroup
  );
  const [abbr, setAbbr] = useState((groupIn && groupIn.attributes.name) || '');
  const [message, setMessage] = useState(<></>);

  const handleAddOrSave = () => {
    if (
      !groupIn ||
      name !== groupIn.attributes.name ||
      abbr !== groupIn.attributes.abbreviation
    ) {
      if (!groupIn) {
        if (addMethod) {
          addMethod(name, abbr);
        }
      } else {
        let group = {
          ...groupIn,
          attributes: {
            name,
            abbr,
          },
        };
        if (editMethod) {
          editMethod(group);
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
  const handleNameChange = (e: any) => {
    setName(e.target.value);
    setAbbr(makeAbbr(e.target.value));
  };
  const handleAbbrChange = (e: any) => {
    setAbbr(e.target.value);
  };
  const handleMessageReset = () => {
    setMessage(<></>);
  };

  useEffect(() => {
    const newName = groupIn ? groupIn.attributes.name : t.newGroup;
    setName(newName);
    setAbbr(groupIn ? groupIn.attributes.abbreviation : makeAbbr(newName));
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [groupIn]);

  useEffect(() => {
    setOpen(visible);
  }, [visible]);

  return (
    <div>
      <Dialog
        open={open}
        onClose={handleCancel}
        aria-labelledby="form-dialog-title"
      >
        <DialogTitle id="form-dialog-title">
          {groupIn ? t.editGroup : t.addGroup}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>{t.newGroupTask}</DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            variant="filled"
            id="name"
            label={t.name}
            value={name}
            onChange={handleNameChange}
            required
            fullWidth
          />
          <TextField
            autoFocus
            margin="dense"
            variant="filled"
            id="abbr"
            label={t.abbr}
            value={abbr}
            onChange={handleAbbrChange}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancel} variant="outlined" color="primary">
            {t.cancel}
          </Button>
          <Button
            onClick={handleAddOrSave}
            variant="contained"
            color="primary"
            disabled={name === '' || name === t.newGroup}
          >
            {!groupIn ? t.add : t.save}
          </Button>
        </DialogActions>
      </Dialog>
      <SnackBar {...props} message={message} reset={handleMessageReset} />
    </div>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'groupAdd' }),
});

export default connect(mapStateToProps)(GroupAdd) as any;
