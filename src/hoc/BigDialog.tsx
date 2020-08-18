import React from 'react';
import clsx from 'clsx';
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
        minWidth: '600px',
      },
      '& .MuiTable-root': {
        tableLayout: 'auto',
        paddingRight: theme.spacing(1),
      },
    },
    rootMd: {
      '& .MuiDialog-paper': {
        minWidth: '960px',
      },
    },
    rootLg: {
      '& .MuiDialog-paper': {
        minWidth: '1280px',
      },
    },
    rootXl: {
      '& .MuiDialog-paper': {
        minWidth: '1920px',
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

export enum BigDialogBp {
  'md',
  'lg',
  'xl',
}

interface IProps {
  title: string;
  children: JSX.Element;
  isOpen: boolean;
  onOpen: (isOpen: boolean) => void;
  bp?: BigDialogBp;
}

export function BigDialog({ title, children, isOpen, onOpen, bp }: IProps) {
  const classes = useStyles();

  const handleClose = () => {
    onOpen && onOpen(false);
  };

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      className={clsx(classes.root, {
        [classes.rootMd]: bp === BigDialogBp.md,
        [classes.rootLg]: bp === BigDialogBp.lg,
        [classes.rootXl]: bp === BigDialogBp.xl,
      })}
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
