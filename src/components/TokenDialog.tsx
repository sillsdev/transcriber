import { IMainStrings } from '../model';
import {
  Dialog,
  DialogTitle,
  Button,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import { mainSelector } from '../selector';
import { shallowEqual, useSelector } from 'react-redux';

interface TokenDialogProps {
  seconds: number;
  open: boolean;
  onClose: (value: number) => void;
}

function TokenDialog(props: TokenDialogProps) {
  const { seconds, onClose, open } = props;
  const t: IMainStrings = useSelector(mainSelector, shallowEqual);

  const handleClose = () => onClose(-1);
  const handleExit = () => onClose(-1);
  const handleContinue = () => onClose(0);

  return (
    <Dialog
      onClose={handleClose}
      aria-labelledby="tokenDlg"
      open={open}
      disableEnforceFocus
    >
      <DialogTitle id="tokenDlg">{t.sessionExpiring}</DialogTitle>
      <DialogContentText sx={{ px: 4 }}>
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

export default TokenDialog;
