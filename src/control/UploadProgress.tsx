import React, { useEffect, useRef } from 'react';
import { connect } from 'react-redux';
import { IState, IUploadProgressStrings } from '../model';
import localStrings from '../selector/localize';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Box,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';

interface IStateProps {
  t: IUploadProgressStrings;
}

interface IProps extends IStateProps {
  open: boolean;
  title?: string;
  progress: number;
  steps?: string[];
  currentStep?: number;
  action?: (choice: string) => void;
  allowCancel?: boolean;
}

export function UploadProgress(props: IProps) {
  const { open, title, progress, action, allowCancel, t } = props;
  const { steps, currentStep } = props;
  const cancelRef = useRef(false);

  const handleChoice = (choice: string) => () => {
    if (!cancelRef.current) {
      cancelRef.current = true;
      if (action) action(choice);
    }
  };
  useEffect(() => {
    if (open) cancelRef.current = false;
  }, [open]);

  return (
    <Dialog
      open={open}
      onClose={handleChoice('Close')}
      aria-labelledby="uploadProgDlg"
    >
      <DialogTitle id="uploadProgDlg">{title || t.progressTitle}</DialogTitle>
      <DialogContent>
        {steps && currentStep !== undefined && (
          <List dense component="div">
            {steps.map((s, i) => (
              <ListItem key={i} role="listitem">
                <ListItemAvatar>
                  <Avatar sx={{ color: 'green' }}>
                    {currentStep > i && <CheckIcon />}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText primary={s} />
              </ListItem>
            ))}
            <ListItem />
          </List>
        )}
        <Box sx={{ width: '100%' }}>
          <LinearProgress variant="determinate" value={progress} />
          {cancelRef.current && <Typography>{t.canceling}</Typography>}
        </Box>
      </DialogContent>
      {allowCancel && (
        <DialogActions>
          <Button
            id="uploadProgCancel"
            onClick={handleChoice('Cancel')}
            color="primary"
            disabled={cancelRef.current}
          >
            {t.cancel}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'uploadProgress' }),
});

export default connect(mapStateToProps)(UploadProgress) as any;
