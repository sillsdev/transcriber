import React from 'react';
import { Group, IPeerStrings, ISharedStrings } from '../../model';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import TextField from '@material-ui/core/TextField';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import AddIcon from '@material-ui/icons/Add';
import { useSelector, shallowEqual } from 'react-redux';
import { peerSelector, sharedSelector } from '../../selector';
import Confirm from '../AlertDialog';
import { useSnackBar } from '../../hoc/SnackBar';

interface IProps {
  cur?: Group;
  save: (name: string, id?: string) => void;
  remove?: (id: string) => void;
  isAdmin: boolean;
  inUse: string[];
}

export default function GroupDialog({
  cur,
  save,
  remove,
  isAdmin,
  inUse,
}: IProps) {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState('');
  const [confirm, setConfirm] = React.useState<string>();
  const { showMessage } = useSnackBar();
  const t = useSelector(peerSelector, shallowEqual) as IPeerStrings;
  const ts = useSelector(sharedSelector, shallowEqual) as ISharedStrings;

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleCancel = () => {
    setName('');
    setOpen(false);
  };

  const handleSave = () => {
    if (inUse.includes(name.toLocaleLowerCase())) {
      showMessage(t.inUse);
      return;
    }
    save(name, cur?.id);
    setName('');
    setOpen(false);
  };

  const handleRemove = () => {
    setConfirm(t.removeConfirm);
  };

  const handleRemoveRefused = () => {
    setConfirm(undefined);
  };

  const handleRemoveConfirmed = () => {
    setConfirm(undefined);
    remove && remove(cur?.id || '');
    setOpen(false);
  };

  React.useEffect(() => {
    if (cur) setName(cur.attributes?.name);
  }, [cur]);

  return (
    <div>
      {cur ? (
        <Button
          id={`${cur.attributes.abbreviation}Open`}
          color="primary"
          onClick={handleClickOpen}
          disabled={!isAdmin}
        >
          {cur.attributes?.name}
        </Button>
      ) : (
        <IconButton
          id="peerOpen"
          color="primary"
          onClick={handleClickOpen}
          disabled={!isAdmin}
        >
          <AddIcon />
        </IconButton>
      )}

      <Dialog
        open={open}
        onClose={handleCancel}
        aria-labelledby="form-dialog-title"
      >
        <DialogTitle id="form-dialog-title">
          {cur ? t.editPeerGroup : t.newPeerGroup}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>{t.peerDescription}</DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="peerName"
            label="Peer Group Name"
            value={name}
            onChange={handleNameChange}
            helperText={inUse.includes(name.toLocaleLowerCase()) && t.inUse}
          />
        </DialogContent>
        <DialogActions>
          {cur && (
            <Button id="peerRemove" onClick={handleRemove} color="primary">
              {t.remove}
            </Button>
          )}
          <Button id="peerCancel" onClick={handleCancel} color="primary">
            {ts.cancel}
          </Button>
          <Button
            id="peerSave"
            onClick={handleSave}
            color="primary"
            disabled={!name}
          >
            {ts.save}
          </Button>
        </DialogActions>
      </Dialog>
      {confirm && (
        <Confirm
          text={confirm}
          yesResponse={handleRemoveConfirmed}
          noResponse={handleRemoveRefused}
        />
      )}
    </div>
  );
}
