import { useState } from 'react';
import { connect } from 'react-redux';
import { IState, IAlertStrings } from '../model';
import localStrings from '../selector/localize';
import {
  Button,
  Dialog,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import DialogActions, { DialogActionsProps } from '@mui/material/DialogActions';

// see: https://mui.com/material-ui/customization/how-to-customize/
interface StyledActionsProps extends DialogActionsProps {
  noOnLeft?: boolean;
}
const StyledDialogActions = styled(DialogActions, {
  shouldForwardProp: (prop) => prop !== 'noOnLeft',
})<StyledActionsProps>(({ noOnLeft }) => ({
  ...(noOnLeft && {
    display: 'flex',
    justifyContent: 'space-between',
  }),
}));

interface IStateProps {
  t: IAlertStrings;
}
interface IProps extends IStateProps {
  title: string;
  text: string;
  jsx: JSX.Element;
  no: string;
  yes: string;
  noResponse: () => {};
  yesResponse: () => {};
  noOnLeft?: boolean;
  isDelete?: boolean;
}

function AlertDialog(props: IProps) {
  const {
    title,
    text,
    jsx,
    no,
    yes,
    yesResponse,
    noResponse,
    noOnLeft,
    isDelete,
    t,
  } = props;
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
    <Dialog
      open={open}
      onClose={handleClose}
      aria-labelledby="alertDlg"
      aria-describedby="alertDesc"
    >
      <DialogTitle id="alertDlg">
        {title || (isDelete ? t.delete : t.confirmation)}
      </DialogTitle>
      <DialogContent>
        <DialogContent id="alertJsx">{jsx}</DialogContent>
        <DialogContentText id="alertDesc">
          {text || t.areYouSure}
        </DialogContentText>
      </DialogContent>
      <StyledDialogActions noOnLeft={noOnLeft}>
        <Button id="alertNo" onClick={handleNo} color="primary">
          {no || t.no}
        </Button>
        {yes !== '' && (
          <Button
            id="alertYes"
            onClick={handleYes}
            variant="contained"
            color="primary"
            autoFocus
          >
            {yes || t.yes}
          </Button>
        )}
      </StyledDialogActions>
    </Dialog>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'alert' }),
});

export default connect(mapStateToProps)(AlertDialog) as any;
