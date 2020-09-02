import { useState, useEffect, useGlobal } from 'reactn';
import React from 'react';
import {
  Snackbar,
  IconButton,
  makeStyles,
  Theme,
  createStyles,
} from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';

interface IStateProps {}

interface IDispatchProps {}

interface IProps extends IStateProps, IDispatchProps {
  children: JSX.Element;
}
const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    close: {
      padding: theme.spacing(0.5),
    },
  })
);
export const useSnackBar = () => {
  const [message, setMessage] = useGlobal('snackMessage');

  const showMessage = (msg: string) => {
    setMessage(<span>{msg}</span>);
  };
  const showJSXMessage = (msg: JSX.Element) => {
    setMessage(msg);
  };
  const showTitledMessage = (title: string, msg: string) => {
    setMessage(
      <span>
        {title}
        <br />
        {msg}
      </span>
    );
  };
  const messageReset = () => setMessage(<></>);
  interface ISBProps {
    message: JSX.Element;
  }

  function SimpleSnackbar(props: ISBProps) {
    const { message } = props;
    const classes = useStyles();
    const [open, setOpen] = useState(true);

    const handleClose = () => {
      messageReset();
      setOpen(false);
    };

    useEffect(() => {
      setOpen(
        message.type === 'span' ||
          (message.type === 'string' && message.toString() !== '')
      );
    }, [message]);

    return open ? (
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

  return {
    SnackBar: SimpleSnackbar,
    message,
    showMessage,
    showJSXMessage,
    showTitledMessage,
  };
};
export default function SnackBarProvider(props: IProps) {
  const { children } = props;
  const { SnackBar } = useSnackBar();
  const [message] = useGlobal('snackMessage');

  return (
    <>
      {children}
      <SnackBar {...props} message={message} />
    </>
  );
}
