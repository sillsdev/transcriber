import React, { useState } from 'react';
import clsx from 'clsx';
import { connect } from 'react-redux';
import { IState, IAlertStrings } from '../model';
import localStrings from '../selector/localize';
import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    actions: {
      display: 'flex',
      justifyContent: 'space-between',
    },
  })
);

interface IStateProps {
  t: IAlertStrings;
}
interface IProps extends IStateProps {
  title: string;
  text: string;
  no: string;
  yes: string;
  noResponse: () => {};
  yesResponse: () => {};
  noOnLeft?: boolean;
}

function AlertDialog(props: IProps) {
  const { title, text, no, yes, yesResponse, noResponse, noOnLeft, t } = props;
  const classes = useStyles();
  const [open, setOpen] = useState(true);

  const handleClose = () => {
    if (noResponse !== null) {
      noResponse();
    }
    setOpen(false);
  };
  const handleNo = () => {
    if (noResponse !== null) {
      noResponse();
    }
    setOpen(false);
  };
  const handleYes = () => {
    if (yesResponse !== null) {
      yesResponse();
    }
    setOpen(false);
  };

  return (
    <div>
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {title || t.confirmation}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {text || t.areYouSure}
          </DialogContentText>
        </DialogContent>
        <DialogActions className={clsx({ [classes.actions]: noOnLeft })}>
          <Button onClick={handleNo} color="primary">
            {no || t.no}
          </Button>
          {yes !== '' && (
            <Button
              onClick={handleYes}
              variant="contained"
              color="primary"
              autoFocus
            >
              {yes || t.yes}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </div>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'alert' }),
});

export default connect(mapStateToProps)(AlertDialog) as any;
