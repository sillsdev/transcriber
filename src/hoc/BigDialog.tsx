import React from 'react';
import { makeStyles, createStyles, Theme } from '@material-ui/core';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
} from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      '& .MuiDialog-paper': {
        maxWidth: '90%',
        minWidth: '535px',
      },
    },
    row: {
      display: 'flex',
    },
    grow: {
      flexGrow: 1,
    },
  })
);

interface IProps {
  title: string;
  children: JSX.Element;
  isOpen: boolean;
  onOpen: (isOpen: boolean) => void;
}

export function BigDialog({ title, children, isOpen, onOpen }: IProps) {
  const classes = useStyles();

  const handleClose = () => {
    onOpen && onOpen(false);
  };

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      className={classes.root}
      aria-labelledby="form-dialog-title"
    >
      <DialogTitle id="form-dialog-title">
        <div className={classes.row}>
          {title}
          <div className={classes.grow}>{'\u00A0'}</div>
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </div>
      </DialogTitle>
      <DialogContent>{children}</DialogContent>
    </Dialog>
  );
}

export default BigDialog;
