import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import { IState, Group, IGroupAddStrings } from '../model';
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

interface IStateProps {
  t: IGroupAddStrings;
}

interface IProps extends IStateProps {
  groupIn: Group | null;
  visible: boolean;
  addMethod?: (groupName: string) => void;
  editMethod?: (groupRec: any) => void;
  cancelMethod?: () => void;
}

function GroupAdd(props: IProps) {
  const { t, visible, addMethod, editMethod, cancelMethod, groupIn } = props;
  const [open, setOpen] = useState(visible);
  const [name, setName] = useState(
    (groupIn && groupIn.attributes.name) || t.newGroup
  );
  const [message, setMessage] = useState(<></>);
  const [inProcess, setInProcess] = useState(false);

  const handleAddOrSave = () => {
    doAddOrSave();
    setInProcess(true);
  };
  const doAddOrSave = async () => {
    if (!groupIn || name !== groupIn.attributes.name) {
      if (!groupIn) {
        if (addMethod) {
          addMethod(name);
        }
      } else {
        let group = {
          ...groupIn,
          attributes: {
            name,
          },
        };
        if (editMethod) {
          editMethod(group);
        }
      }
    }
    setOpen(false);
    setInProcess(false);
  };
  const handleCancel = () => {
    if (cancelMethod) {
      cancelMethod();
    }
    setOpen(false);
  };
  const handleNameChange = (e: any) => {
    setName(e.target.value);
  };
  const handleMessageReset = () => {
    setMessage(<></>);
  };

  useEffect(() => {
    const newName = groupIn ? groupIn.attributes.name : t.newGroup;
    setName(newName);
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
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancel} variant="outlined" color="primary">
            {t.cancel}
          </Button>
          <Button
            onClick={handleAddOrSave}
            variant="contained"
            color="primary"
            disabled={name === '' || name === t.newGroup || inProcess}
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
