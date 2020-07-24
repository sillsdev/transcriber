import React from 'react';
import { Typography, Button } from '@material-ui/core';
import { makeStyles } from '@material-ui/core';

const useStyles = makeStyles({
  navButton: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
});

const t = {
  transcribe: 'Transcribe',
  switchTo: 'Switch to:',
};

interface IProps {
  label?: string;
  switchTo?: () => void;
  disabled?: boolean;
}

export const TranscribeSwitch = (props: IProps) => {
  const { label, switchTo, disabled } = props;
  const classes = useStyles();

  const handleSwitch = () => {
    if (switchTo) switchTo();
  };

  return (
    <div className={classes.navButton}>
      <Typography>{t.switchTo + '\u00A0'}</Typography>
      <Button
        variant="contained"
        color="primary"
        onClick={handleSwitch}
        disabled={disabled}
      >
        {label || t.transcribe}
      </Button>
    </div>
  );
};
