import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { IState, IToken } from '../model';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import * as actions from '../store';
import TokenDialog from '../components/TokenDialog';
import moment from 'moment';
import Auth from '../auth/Auth';
import jwtDecode from 'jwt-decode';
import { useGlobal } from 'reactn';
import { useUpdateOrbitToken } from '../crud';
import { logError, Severity, useInterval } from '../utils';
import { isElectron } from '../api-variable';
const ipc = isElectron ? require('electron').ipcRenderer : null;

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
  const { getAccessTokenSilently, user } = useAuth0();
  const [modalOpen, setModalOpen] = React.useState(false);
  const [secondsToExpire, setSecondsToExpire] = React.useState(0);
  const [offline] = useGlobal('offline');
  const [errorReporter] = useGlobal('errorReporter');
  const updateOrbitToken = useUpdateOrbitToken();
  const view = React.useRef<any>('');

  const resetExpiresAt = () => {
    if (isElectron) {
      ipc
        ?.invoke('refresh-token')
        .then(async () => {
          console.log(`Token check refreshed`);
          const myUser = await ipc?.invoke('get-profile');
          console.log(JSON.stringify(myUser, null, 2));
          const myToken = await ipc?.invoke('get-token');
          console.log(`new token=${myToken}`);
          updateOrbitToken(myToken);
          const decodedToken = jwtDecode(myToken) as IToken;
          console.log(JSON.stringify(decodedToken, null, 2));
          setExpireAt(decodedToken.exp);
          auth.setAuthSession(myUser, myToken, decodedToken.exp);
        })
        .catch((e: Error) => {
          handleLogOut();
          logError(Severity.error, errorReporter, e);
        });
    } else {
      getAccessTokenSilently()
        .then((token) => {
          updateOrbitToken(token);
          const decodedToken = jwtDecode(token) as IToken;
          setExpireAt(decodedToken.exp);
          auth.setAuthSession(user, token, decodedToken.exp);
        })
        .catch((e: Error) => {
          handleLogOut();
          logError(Severity.error, errorReporter, e);
        });
    }
  };

  React.useEffect(() => {
    if (!offline) {
      if (localStorage.getItem('isLoggedIn') === 'true') {
        resetExpiresAt();
      }
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  const handleLogOut = () => {
    auth.expiresAt = -1;
    view.current = 'loggedOut';
    setModalOpen(false);
  };

  const checkTokenExpired = () => {
    if (!offline) {
      if (localStorage.getItem('isLoggedIn') !== 'true' && auth.accessToken) {
        handleLogOut();
      }
      if (expireAt) {
        const currentUnix = moment().locale('en').format('X');
        const expires = moment.unix(expireAt).locale('en').format('X');
        const secondsLeft = Number(expires) - Number(currentUnix);
        console.log(`TokenCheck left=${secondsLeft} Expires=${Expires}`);
        if (secondsLeft < Expires + 30) {
          setSecondsToExpire(secondsLeft);
          if (modalOpen) view.current = '';
          setModalOpen(true);
        }
      }
    }
  };

  console.log(`TokenCheck expireAt=${expireAt} offline=${offline}`);
  useInterval(checkTokenExpired, expireAt && !offline ? 1000 : null);

  const handleClose = (value: number) => {
    setModalOpen(false);
    if (value < 0) {
      view.current = 'Logout';
    } else {
      resetExpiresAt();
      view.current = 'Continue';
    }
  };

  if (modalOpen && view.current === '') {
    if (secondsToExpire < Expires) {
      handleLogOut();
    }
    return (
      <TokenDialog
        seconds={secondsToExpire}
        open={modalOpen}
        onClose={handleClose}
      />
    );
  } else if (view.current === 'Logout') {
    handleLogOut();
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
