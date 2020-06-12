import React from 'react';
import { IMainStrings } from '../model';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@material-ui/core';

interface IStateProps {
  t: IMainStrings;
}

interface IProps extends IStateProps {
  open: boolean;
  path?: string;
  action?: (choice: string) => void;
}

export default function ResetAlert(props: IProps) {
  const { open, path, action, t } = props;

  const handleChoice = (choice: string) => () => {
    if (action) action(choice);
  };

  return (
    <Dialog
      open={open}
      onClose={handleChoice('Close')}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle id="alert-dialog-title">{t.resetTitle}</DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description">
          {t.resetDesc.replace('{0}', path || '/usr/lib/sil-transcriber')}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleChoice('Cancel')} color="primary">
          {t.cancel}
        </Button>
        <Button onClick={handleChoice('Continue')} color="primary" autoFocus>
          {t.continue}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
