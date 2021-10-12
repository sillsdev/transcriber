import { useState, useEffect, useGlobal } from 'reactn';
import {
  Snackbar,
  IconButton,
  makeStyles,
  Theme,
  createStyles,
} from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import MuiAlert, { AlertProps } from '@material-ui/lab/Alert';
import { useMounted } from '../utils';

const Alert = (props: AlertProps) => {
  return <MuiAlert elevation={6} {...props} />;
};

export enum AlertSeverity {
  Error = 'error',
  Info = 'info',
  Success = 'success',
  Warning = 'warning',
}

interface IProps {
  children: JSX.Element;
}
const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    alert: {
      display: 'flex',
    },
    bar: {
      '& .MuiPaper-root': {
        alignItems: 'center',
      },
    },
    close: {
      padding: theme.spacing(0.5),
    },
  })
);

export const useSnackBar = () => {
  const [message, setMessage] = useGlobal('snackMessage');
  const [, setAlert] = useGlobal('snackAlert');

  const messageReset = () => {
    setMessage(<></>);
  };

  const showMessage = (msg: string | JSX.Element, alert?: AlertSeverity) => {
    setAlert(alert);
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
    const isMounted = useMounted('snackbar');
    const { message } = props;
    const [alert] = useGlobal('snackAlert');
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

    const CloseButton = () => (
      <IconButton
        id="msgClose"
        key="close"
        aria-label="Close"
        color="inherit"
        className={classes.close}
        onClick={handleClose}
        component="span"
      >
        <CloseIcon />
      </IconButton>
    );

    return isMounted() && open ? (
      !alert ? (
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
          action={CloseButton()}
        />
      ) : (
        <Snackbar open={open} onClose={handleClose} autoHideDuration={30000}>
          <div className={classes.bar}>
            <Alert severity={alert} action={CloseButton()}>
              {message}
            </Alert>
          </div>
        </Snackbar>
      )
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
