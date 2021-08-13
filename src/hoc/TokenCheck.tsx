import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { IState } from '../model';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import * as actions from '../store';
import TokenDialog from '../components/TokenDialog';
import moment from 'moment';
import Auth from '../auth/Auth';
import jwtDecode from 'jwt-decode';
import { useGlobal } from 'reactn';
import { logError, Severity } from '../utils';
import { useInterval } from '../utils/useInterval';

const Expires = 0; // Set to 7110 to test 1:30 token

interface IStateProps {
  expireAt: number | undefined;
}

interface IDispatchProps {
  setExpireAt: typeof actions.setExpireAt;
}

interface IProps extends IStateProps, IDispatchProps {
  auth: Auth;
  children: JSX.Element;
}

function TokenCheck(props: IProps) {
  const { auth, children, expireAt, setExpireAt } = props;
  const { getAccessTokenSilently, logout } = useAuth0();
  const [modalOpen, setModalOpen] = React.useState(false);
  const [secondsToExpire, setSecondsToExpire] = React.useState(0);
  const [offline] = useGlobal('offline');
  const [errorReporter] = useGlobal('errorReporter');
  const view = React.useRef<any>('');
  const timer = React.useRef<NodeJS.Timeout>();

  const resetExpiresAt = () => {
    getAccessTokenSilently()
      .then((token) => {
        const decodedToken: any = jwtDecode(token);
        setExpireAt(decodedToken.exp);
      })
      .catch((e: Error) => {
        view.current = 'Logout';
        logError(Severity.error, errorReporter, e);
      });
  };

  React.useEffect(() => {
    if (!offline) {
      if (localStorage.getItem('isLoggedIn') === 'true') {
        resetExpiresAt();
      }
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  const checkTokenExpired = () => {
    if (!offline) {
      if (localStorage.getItem('isLoggedIn') !== 'true' && auth.accessToken) {
        auth.logout();
        view.current = 'loggedOut';
        logout();
      }
      if (expireAt) {
        const currentUnix = moment().format('X');
        const expires = moment.unix(expireAt).format('X');
        const secondsLeft = Number(expires) - Number(currentUnix);
        if (secondsLeft < Expires + 30) {
          setSecondsToExpire(secondsLeft);
          setModalOpen(true);
        }
      }
    }
  };

  useInterval(checkTokenExpired, expireAt && !offline ? 1000 : null);

  const handleClose = (value: number) => {
    setModalOpen(false);
    if (timer.current) clearInterval(timer.current);
    if (value < 0) {
      view.current = 'Logout';
    } else {
      resetExpiresAt();
    }
  };

  if (modalOpen && view.current === '') {
    if (secondsToExpire < Expires) {
      if (timer.current) clearInterval(timer.current);
      auth.logout();
      logout();
      view.current = 'loggedOut';
    }
    return (
      <TokenDialog
        seconds={secondsToExpire}
        open={modalOpen}
        onClose={handleClose}
      />
    );
  } else if (view.current === 'Logout') {
    auth.logout();
    logout();
    view.current = 'loggedOut';
  }

  // If there is no error just render the children component.
  return children;
}

const mapStateToProps = (state: IState): IStateProps => ({
  expireAt: state.auth.expireAt,
});

const mapDispatchToProps = (dispatch: any): IDispatchProps => ({
  ...bindActionCreators(
    {
      setExpireAt: actions.setExpireAt,
    },
    dispatch
  ),
});

export default connect(mapStateToProps, mapDispatchToProps)(TokenCheck);
