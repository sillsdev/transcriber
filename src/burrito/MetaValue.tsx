import * as React from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

interface MetaValueProps {
  idKey: string;
  value: unknown;
  onConfirm: (key: string, value: unknown) => void;
  isOpen: boolean;
  onOpen: (isOpen: boolean) => void;
}

export default function MetaValue({
  idKey,
  value,
  onConfirm,
  isOpen,
  onOpen,
}: MetaValueProps) {
  const [open, setOpen] = React.useState(isOpen);
  const [newValue, setNewValue] = React.useState(value);

  const handleClose = () => {
    setOpen(false);
    onOpen(false);
  };

  React.useEffect(() => {
    setOpen(isOpen);
  }, [isOpen]);

  React.useEffect(() => {
    setNewValue(value);
  }, [value]);

  const containsJsonChars = (val: unknown): boolean => {
    if (typeof val !== 'string') return false;
    return /[{}[\]"']/.test(val);
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      PaperProps={{
        component: 'form',
        onSubmit: (event: React.FormEvent<HTMLFormElement>) => {
          event.preventDefault();
          onConfirm(idKey, newValue);
          handleClose();
        },
      }}
    >
      <DialogTitle>Update Value</DialogTitle>
      <DialogContent>
        <DialogContentText>Please enter the new value for</DialogContentText>
        <TextField
          autoFocus
          margin="dense"
          id="name"
          data-cy="value-input"
          value={newValue}
          onChange={(event) => setNewValue(event.target.value)}
          name={idKey}
          label={idKey as string}
          fullWidth
          multiline
          variant="standard"
          error={containsJsonChars(newValue)}
          helperText={
            containsJsonChars(newValue)
              ? 'Warning: Input contains JSON structural characters (quotes, curly braces, or square brackets)'
              : ''
          }
          sx={{ width: '500px' }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button type="submit" disabled={containsJsonChars(newValue)}>
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
}
