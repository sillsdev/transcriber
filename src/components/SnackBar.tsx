import React, { useState, useEffect } from 'react';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import Snackbar from '@material-ui/core/Snackbar';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    close: {
      padding: theme.spacing(0.5),
    },
  })
);

interface IProps {
  message: JSX.Element;
  reset: () => {};
}

function SimpleSnackbar(props: IProps) {
  const { message, reset = null } = props;
  const classes = useStyles();
  const [open, setOpen] = useState(true);

  const handleClose = () => {
    if (reset !== null) {
      reset();
    }
    setOpen(false);
  };

  useEffect(() => {
    setOpen(
      message.type === 'span' ||
        (message.type === 'string' && message.toString() !== '')
    );
  }, [message]);

  return message.type === 'span' ||
    (message.type === 'string' && message.toString() !== '') ? (
    <Snackbar
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'center',
      }}
      open={open}
      autoHideDuration={6000}
      onClose={handleClose}
      ContentProps={{
        'aria-describedby': 'message-id',
      }}
      message={<span id="message-id">{message}</span>}
      action={[
        <IconButton
          key="close"
          aria-label="Close"
          color="inherit"
          className={classes.close}
          onClick={handleClose}
        >
          <CloseIcon />
        </IconButton>,
      ]}
    />
  ) : (
    <></>
  );
}

export default SimpleSnackbar;
