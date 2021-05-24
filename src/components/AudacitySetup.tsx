import React from 'react';
import { useGlobal } from 'reactn';
import { connect } from 'react-redux';
import { IState, IAudacitySetupStrings } from '../model';
import localStrings from '../selector/localize';
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
import {
  hasAudacity,
  hasAuacityScripts,
  hasPython,
  enableAudacityScripts,
} from '../utils';

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
  url: string | (() => Promise<void>);
  help?: boolean;
  testIt: () => Promise<boolean>;
}

interface IStateProps {
  t: IAudacitySetupStrings;
}

export interface AudacitySetupProps extends IStateProps {
  open: boolean;
  onClose: () => void;
}

function AudacitySetup(props: AudacitySetupProps) {
  const { t } = props;
  const classes = useStyles();
  const { onClose, open } = props;
  const [allAudacity, setAllAdudacity] = useGlobal('allAudacity');
  const [satisfied, setSatisfied] = React.useState<boolean[]>([
    false,
    false,
    false,
  ]);
  const steps: StepType[] = [
    {
      item: Step.Audacity,
      choice: t.audacityInstalled,
      action: t.getInstaller,
      url: 'https://www.audacityteam.org/download/',
      testIt: hasAudacity,
    },
    {
      item: Step.Scripting,
      choice: t.scriptingEnabled,
      action: t.enable,
      url: enableAudacityScripts,
      help: true,
      testIt: hasAuacityScripts,
    },
    {
      item: Step.Python,
      choice: t.pythonInstalled,
      action: t.getInstaller,
      url: 'https://www.python.org/downloads/',
      testIt: hasPython,
    },
  ];

  const handleClose = () => {
    onClose();
  };

  const doEval = async () => {
    hasAudacity().then((r) => setSatisfied((a) => [r, a[1], a[2]]));
    hasAuacityScripts().then((r) => setSatisfied((a) => [a[0], r, a[2]]));
    hasPython().then((r) => setSatisfied((a) => [a[0], a[1], r]));
  };

  const handleEval = () => doEval();

  React.useEffect(() => {
    doEval();
  }, []);

  React.useEffect(() => {
    if (satisfied[0] && satisfied[1] && satisfied[2] && !allAudacity)
      setAllAdudacity(true);
    else if (!satisfied[0] || !satisfied[1] || !satisfied[2])
      if (allAudacity) setAllAdudacity(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [satisfied]);

  const textDecoration = { textDecoration: 'none' };

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
            {t.audacitySetup}
            <IconButton onClick={handleEval}>
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
                {satisfied[i] && <CheckIcon />}
              </Avatar>
            </ListItemAvatar>
            <ListItemText primary={steps.choice} />
            {!satisfied[i] && (
              <ListItemSecondaryAction>
                {typeof steps.url === 'string' ? (
                  <a
                    id={`action-${i}`}
                    style={textDecoration}
                    href={steps.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button>{steps.action}</Button>
                  </a>
                ) : (
                  <Button id={`action-${i}`} onClick={steps.url}>
                    {steps.action}
                  </Button>
                )}
              </ListItemSecondaryAction>
            )}
          </ListItem>
        ))}
      </List>
      <DialogActions>
        <Button onClick={handleClose}>{t.close}</Button>
      </DialogActions>
    </Dialog>
  );
}

export function AudacitySetupButton(props: IStateProps) {
  const { t } = props;
  const [open, setOpen] = React.useState(false);
  const [allAudacity] = useGlobal('allAudacity');

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <div>
      <Button
        variant="outlined"
        color={allAudacity ? 'primary' : 'default'}
        onClick={handleClickOpen}
      >
        <AudacityLogo disabled={!allAudacity} />
        {t.audacitySetup}
      </Button>
      <AudacitySetup open={open} onClose={handleClose} t={t} />
    </div>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'audacitySetup' }),
});

export default connect(mapStateToProps)(AudacitySetupButton) as any;
