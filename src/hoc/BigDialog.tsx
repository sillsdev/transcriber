import React from 'react';
import { useGlobal } from 'reactn';
import clsx from 'clsx';
import { ISharedStrings, IState } from '../model';
import { connect } from 'react-redux';
import localStrings from '../selector/localize';
import { makeStyles, createStyles, Theme } from '@material-ui/core';
import {
  Dialog,
  DialogContent,
  DialogActions,
  DialogTitle,
  IconButton,
  Button,
} from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      '& .MuiDialog-paper': {
        maxWidth: '90%',
        minWidth: '600px',
        minHeight: '80%',
      },
      '& .MuiTable-root': {
        tableLayout: 'auto',
        paddingRight: theme.spacing(1),
      },
      '& .MuiDialogTitle-root': {
        paddingBottom: 0,
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

interface IStateProps {
  ts: ISharedStrings;
}

export enum BigDialogBp {
  'md',
  'lg',
  'xl',
}

interface IProps extends IStateProps {
  title: string;
  children: JSX.Element;
  isOpen: boolean;
  onOpen: (isOpen: boolean) => void;
  onCancel?: () => void;
  onSave?: () => void;
  bp?: BigDialogBp;
}

export function BigDialog({
  title,
  children,
  isOpen,
  onOpen,
  onCancel,
  onSave,
  bp,
  ts,
}: IProps) {
  const classes = useStyles();
  const [isExportBusy] = useGlobal('importexportBusy');
  const [enableOffsite, setEnableOffsite] = useGlobal('enableOffsite');

  const handleClose = () => {
    if (enableOffsite) setEnableOffsite(false);
    if (!isExportBusy) onOpen && onOpen(false);
    if (onCancel) onCancel();
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
      aria-labelledby="bigDlg"
    >
      <DialogTitle id="bigDlg">
        <div className={classes.row}>
          {title}
          <div className={classes.grow}>{'\u00A0'}</div>
          {!isExportBusy ? (
            <IconButton id="bigClose" onClick={handleClose}>
              <CloseIcon />
            </IconButton>
          ) : (
            <div />
          )}
        </div>
      </DialogTitle>
      <DialogContent>{children}</DialogContent>
      {(onCancel || onSave) && (
        <DialogActions>
          {onCancel && (
            <Button id="bigCancel" onClick={onCancel} color="primary">
              {ts.cancel}
            </Button>
          )}
          {onSave && (
            <Button color="primary" onClick={onSave}>
              {ts.save}
            </Button>
          )}
        </DialogActions>
      )}
    </Dialog>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
  ts: localStrings(state, { layout: 'shared' }),
});

export default connect(mapStateToProps)(BigDialog);
