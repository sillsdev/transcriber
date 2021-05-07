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

  const messageReset = () => {
    setMessage(<></>);
  };

  const showMessage = (msg: string | JSX.Element) => {
    if (typeof msg === 'string') {
      if (message.props.children !== msg) setMessage(<span>{msg}</span>);
    } else if (message.props.children !== msg.props.children) setMessage(msg);
  };

  const showTitledMessage = (title: string, msg: JSX.Element | string) => {
    if (
      message.props.children !==
      (typeof msg === 'string' ? msg : msg.props.children)
    )
      setMessage(
        <span>
          {title}
          <br />
          {msg}
        </span>
      );
  };

  interface ISBProps {
    message: JSX.Element;
  }

  function SimpleSnackbar(props: ISBProps) {
    const { message } = props;
    const classes = useStyles();
    const [open, setOpen] = useState(false);

    const handleClose = () => {
      messageReset();
    };

    useEffect(() => {
      if ((message.type === 'span') !== open) {
        setOpen(!open);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
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
            id="msgClose"
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
