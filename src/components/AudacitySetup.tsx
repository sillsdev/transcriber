import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import {
  Button,
  IconButton,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  DialogTitle,
  Dialog,
  DialogActions,
} from '@material-ui/core';
import CheckIcon from '@material-ui/icons/Check';
import RefreshIcon from '@material-ui/icons/Refresh';
import AudacityLogo from '../control/AudacityLogo';

const useStyles = makeStyles({
  root: {
    '& .MuiDialog-paper': {
      minWidth: '450px',
    },
  },
  title: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatar: {
    color: 'green',
  },
});

enum Step {
  Audacity,
  Scripting,
  Python,
}

interface StepType {
  item: Step;
  choice: string;
  action: string;
  help?: boolean;
}

export interface AudacitySetupProps {
  open: boolean;
  onClose: () => void;
}

function AudacitySetup(props: AudacitySetupProps) {
  const classes = useStyles();
  const { onClose, open } = props;
  const steps: StepType[] = [
    {
      item: Step.Audacity,
      choice: 'Audacity Installed',
      action: 'Get Installer',
    },
    {
      item: Step.Scripting,
      choice: 'Scripting Enabled',
      action: 'Enable',
      help: true,
    },
    { item: Step.Python, choice: 'Python Installed', action: 'Get Installer' },
  ];

  const handleClose = () => {
    onClose();
  };

  const handleListItemClick = (value: string) => () => {
    onClose();
  };

  const ifCond = (s: Step) => true;

  return (
    <Dialog
      className={classes.root}
      onClose={handleClose}
      aria-labelledby="audacity-setup-title"
      open={open}
    >
      <DialogTitle id="audacity-setup-title">
        {
          <div className={classes.title}>
            {'Audacity Setup'}
            <IconButton>
              <RefreshIcon />
            </IconButton>
          </div>
        }
      </DialogTitle>
      <List>
        {steps.map((steps, i) => (
          <ListItem key={i}>
            <ListItemAvatar>
              <Avatar className={classes.avatar}>
                {ifCond(steps.item) && <CheckIcon />}
              </Avatar>
            </ListItemAvatar>
            <ListItemText primary={steps.choice} />
            <ListItemSecondaryAction>
              <Button onClick={handleListItemClick(steps.choice)}>
                {steps.action}
              </Button>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>
      <DialogActions>
        <Button onClick={handleClose}>{'Close'}</Button>
      </DialogActions>
    </Dialog>
  );
}

export default function AudacitySetupButton() {
  const [open, setOpen] = React.useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <div>
      <Button variant="outlined" color="primary" onClick={handleClickOpen}>
        <AudacityLogo />
        {'Audacity Setup'}
      </Button>
      <AudacitySetup open={open} onClose={handleClose} />
    </div>
  );
}
