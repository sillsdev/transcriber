import React from 'react';
import { connect } from 'react-redux';
import { IState, IUploadProgressStrings } from '../model';
import localStrings from '../selector/localize';
import { makeStyles, Typography } from '@material-ui/core';
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
} from '@material-ui/core';
import CheckIcon from '@material-ui/icons/Check';

const useStyles = makeStyles({
  progress: {
    width: '100%',
  },
  avatar: {
    color: 'green',
  },
});

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
}

export function UploadProgress(props: IProps) {
  const { open, title, progress, action, t } = props;
  const { steps, currentStep } = props;
  const classes = useStyles();
  const cancelRef = React.useRef(false);

  const handleChoice = (choice: string) => () => {
    if (!cancelRef.current) {
      cancelRef.current = true;
      if (action) action(choice);
    }
  };

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
                  <Avatar className={classes.avatar}>
                    {currentStep > i && <CheckIcon />}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText primary={s} />
              </ListItem>
            ))}
            <ListItem />
          </List>
        )}
        <div className={classes.progress}>
          <LinearProgress variant="determinate" value={progress} />
          {cancelRef.current && <Typography>{t.canceling}</Typography>}
        </div>
      </DialogContent>
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
    </Dialog>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'uploadProgress' }),
});

export default connect(mapStateToProps)(UploadProgress) as any;
