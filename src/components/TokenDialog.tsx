import React from 'react';
import { IMainStrings, IState } from '../model';
import { connect } from 'react-redux';
import localStrings from '../selector/localize';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import {
  Dialog,
  DialogTitle,
  Button,
  DialogContentText,
  DialogActions,
} from '@material-ui/core';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    text: {
      paddingLeft: theme.spacing(4),
      paddingRight: theme.spacing(4),
    },
  })
);

interface IStateProps {
  t: IMainStrings;
}

interface TokenDialogProps extends IStateProps {
  seconds: number;
  open: boolean;
  onClose: (value: number) => void;
}

function TokenDialog(props: TokenDialogProps) {
  const { seconds, onClose, open, t } = props;
  const classes = useStyles();

  const handleClose = () => onClose(-1);
  const handleExit = () => onClose(-1);
  const handleContinue = () => onClose(0);

  return (
    <Dialog onClose={handleClose} aria-labelledby="tokenDlg" open={open}>
      <DialogTitle id="tokenDlg">{t.sessionExpiring}</DialogTitle>
      <DialogContentText className={classes.text}>
        {t.sessionExpireTask.replace('{0}', seconds.toString())}
      </DialogContentText>
      <DialogActions>
        <Button id="tokExit" variant="outlined" onClick={handleExit}>
          {t.exit}
        </Button>
        <Button id="tokCont" variant="contained" onClick={handleContinue}>
          {t.continue}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'main' }),
});

export default connect(mapStateToProps)(TokenDialog);
