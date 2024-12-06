import { ReactElement } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { ISharedStrings } from '../model';
import { useSelector, shallowEqual } from 'react-redux';
import { sharedSelector } from '../selector';
import {
  Dialog,
  DialogProps,
  DialogContent,
  DialogActions,
  DialogTitle,
  IconButton,
  Box,
  styled,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { PriButton, AltButton, GrowingSpacer } from '../control';
import { useSnackBar } from './SnackBar';

export enum BigDialogBp {
  'sm',
  'md',
  'lg',
  'xl',
}

// see: https://mui.com/material-ui/customization/how-to-customize/
export interface StyledDialogProps extends DialogProps {
  bp?: BigDialogBp;
}
// eslint-disable-block TS2783
export const StyledDialog = styled(Dialog, {
  shouldForwardProp: (prop) => prop !== 'bp',
})<StyledDialogProps>(({ bp, theme }) => ({
  '& .MuiTable-root': {
    tableLayout: 'auto',
    paddingRight: theme.spacing(1),
  },
  '& .MuiDialogTitle-root': {
    paddingBottom: 0,
  },
  '& #bigClose': { alignSelf: 'flex-start' },
  ...(bp === BigDialogBp.sm
    ? {
        '& .MuiDialog-paper': {
          maxWidth: '90%',
          minWidth: '600px',
          minHeight: '50%',
        },
      }
    : bp === BigDialogBp.md
    ? {
        '& .MuiDialog-paper': {
          maxWidth: '90%',
          minHeight: '80%',
          minWidth: '960px',
        },
      }
    : bp === BigDialogBp.lg
    ? {
        '& .MuiDialog-paper': {
          maxWidth: '90%',
          minHeight: '80%',
          minWidth: '1280px',
        },
      }
    : bp === BigDialogBp.xl
    ? {
        '& .MuiDialog-paper': {
          maxWidth: '90%',
          minHeight: '80%',
          minWidth: '1920px',
        },
      }
    : {
        '& .MuiDialog-paper': {
          maxWidth: '90%',
          minWidth: '600px',
          minHeight: '80%',
        },
      }),
}));
// eslint-enable-block

interface IProps {
  title: string;
  description?: ReactElement;
  children: JSX.Element;
  isOpen: boolean;
  onOpen: (isOpen: boolean) => void;
  onCancel?: () => void;
  onSave?: () => void;
  bp?: BigDialogBp;
  setCloseRequested?: (close: boolean) => void;
}

export function BigDialog({
  title,
  description,
  children,
  isOpen,
  onOpen,
  onCancel,
  onSave,
  bp,
  setCloseRequested,
}: IProps) {
  const [isExportBusy] = useGlobal('importexportBusy');
  const [enableOffsite, setEnableOffsite] = useGlobal('enableOffsite');
  const ts: ISharedStrings = useSelector(sharedSelector, shallowEqual);
  const { showMessage } = useSnackBar();

  const handleClose = (
    event?: {},
    reason?: 'backdropClick' | 'escapeKeyDown'
  ) => {
    if (isExportBusy) {
      showMessage(ts.wait);
      return;
    }
    setCloseRequested && setCloseRequested(true);
    if (enableOffsite) setEnableOffsite(false);
    onOpen && onOpen(false);
    onCancel && onCancel();
  };

  return (
    <StyledDialog
      open={isOpen}
      onClose={handleClose}
      aria-labelledby="bigDlg"
      bp={bp}
      disableEnforceFocus
    >
      <DialogTitle id="bigDlg">
        <Box sx={{ display: 'flex' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            {title}
            {description}
          </Box>
          <GrowingSpacer />
          {!isExportBusy ? (
            <IconButton id="bigClose" onClick={handleClose}>
              <CloseIcon />
            </IconButton>
          ) : (
            <div />
          )}
        </Box>
      </DialogTitle>
      <DialogContent>{children}</DialogContent>
      {(onCancel || onSave) && (
        <DialogActions>
          {onCancel && (
            <AltButton id="bigCancel" onClick={onCancel} sx={{ color: 'grey' }}>
              {ts.cancel}
            </AltButton>
          )}
          {onSave && <PriButton onClick={onSave}>{ts.save}</PriButton>}
        </DialogActions>
      )}
    </StyledDialog>
  );
}

export default BigDialog;
