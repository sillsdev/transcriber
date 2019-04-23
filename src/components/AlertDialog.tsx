import React, { useState } from 'react';
import { connect } from 'react-redux';
import { IState, IAlertStrings } from '../model';
import localStrings from '../selector/localize';
import { createStyles, Theme, withStyles, WithStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';

const styles = (theme: Theme) => createStyles({ });

interface IStateProps {
  t: IAlertStrings;
}
interface IProps extends IStateProps, WithStyles<typeof styles>{
  title: string;
  text: string;
  no: string;
  yes: string;
  noResponse: () => {};
  yesResponse: () => {};
};

function AlertDialog(props: IProps) {
  const { title, text, no, yes, yesResponse, noResponse, t} = props;
  const [open, setOpen] = useState(true);

  const handleClose = () => { setOpen(false) };
  const handleNo = () => { 
    if (noResponse !== null) { noResponse() };
    setOpen(false);
  };
  const handleYes = () => { 
    if (yesResponse !== null) { yesResponse() };
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
        <DialogActions>
          <Button onClick={handleNo} color="primary">
            {no || t.no}
          </Button>
          <Button onClick={handleYes} color="primary" autoFocus>
            {yes || t.yes}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, {layout: "alert"})
});

export default withStyles(styles, { withTheme: true })(
      connect(mapStateToProps)(AlertDialog) as any
  ) as any;
