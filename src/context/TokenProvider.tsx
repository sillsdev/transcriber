/* eslint-disable jsx-a11y/anchor-has-content */
import React from 'react';
import { User, useAuth0 } from '@auth0/auth0-react';
import { IToken } from '../model';
import Busy from '../components/Busy';
import TokenDialog from '../components/TokenDialog';
import moment from 'moment';
import jwtDecode from 'jwt-decode';
import { useGlobal } from 'reactn';
import { useUpdateOrbitToken } from '../crud';
import { logError, Severity, useInterval } from '../utils';
import { isElectron } from '../api-variable';
const ipc = (window as any)?.electron;

const Expires = 0; // Set to 7110 to test 1:30 token

const initState = {
  accessToken: null as string | null,
  profile: undefined as User | undefined,
  expiresAt: 0 as number | null,
  email_verified: false as boolean | undefined,
  logout: () => {},
  resetExpiresAt: () => {},
  authenticated: () => false,
  setAuthSession: (
    profile: User | undefined,
    accessToken: string,
    expire?: number
  ) => {},
};

export type ICtxState = typeof initState;

export interface ITokenContext {
  state: ICtxState;
  setState: React.Dispatch<React.SetStateAction<ICtxState>>;
}

const TokenContext = React.createContext({} as ITokenContext);

interface IProps {
  children: JSX.Element;
}

function TokenProvider(props: IProps) {
  const { children } = props;
  const {
    getAccessTokenSilently,
    loginWithRedirect,
    user,
    isLoading,
    isAuthenticated,
    error,
  } = useAuth0();
  const [modalOpen, setModalOpen] = React.useState(false);
  const [secondsToExpire, setSecondsToExpire] = React.useState(0);
  const [offline] = useGlobal('offline');
  const [errorReporter] = useGlobal('errorReporter');
  const updateOrbitToken = useUpdateOrbitToken();
  const view = React.useRef<any>('');
  const [state, setState] = React.useState({
    ...initState,
  });

  const setAuthSession = (
    profile: User | undefined,
    accessToken: string,
    expire?: number
  ) => {
    setState((state) => ({
      ...state,
      accessToken,
      profile,
      expiresAt: expire || accessToken ? new Date(5000, 0, 0).getTime() : null,
      email_verified: profile?.email_verified,
    }));
    localStorage.setItem('isLoggedIn', 'true');
  };

  React.useEffect(() => {
    (async () => {
      if (isAuthenticated && user) {
        console.log(`checking for token`);
        getAccessTokenSilently()
          .then((token) => {
            updateOrbitToken(token);
            const decodedToken = jwtDecode(token) as IToken;
            setState((state) => ({ ...state, expireAt: decodedToken.exp }));
            setAuthSession(user, token, decodedToken.exp);
          })
          .catch((e: any) => {
            handleLogOut();
            loginWithRedirect();
          });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user]);

  const logout = () => {
    setState((state) => ({
      ...state,
      accessToken: null,
      profile: undefined,
      expiresAt: 0,
    }));
  };

  const authenticated = () => {
    if (!state.email_verified) return false;
    return new Date().getTime() < (state.expiresAt || 0);
  };

  const resetExpiresAt = () => {
    if (offline) return;
    if (isElectron) {
      ipc
        ?.invoke('refresh-token')
        .then(async () => {
          const myUser = await ipc?.getProfile();
          const myToken = await ipc?.getToken();
          updateOrbitToken(myToken);
          const decodedToken = jwtDecode(myToken) as IToken;
          setState((state) => ({ ...state, expireAt: decodedToken.exp }));
          setAuthSession(myUser, myToken, decodedToken.exp);
        })
        .catch((e: Error) => {
          localStorage.setItem('offlineAdmin', 'false');
          localStorage.removeItem('user-id');
          handleLogOut();
          logError(Severity.error, errorReporter, e);
        });
    } else {
      getAccessTokenSilently()
        .then((token) => {
          updateOrbitToken(token);
          const decodedToken = jwtDecode(token) as IToken;
          setState((state) => ({ ...state, expireAt: decodedToken.exp }));
          setAuthSession(user, token, decodedToken.exp);
        })
        .catch((e: any) => {
          handleLogOut();
          logError(Severity.error, errorReporter, e);
          loginWithRedirect();
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
    setState((state) => ({ ...state, expiresAt: -1 }));
    view.current = 'loggedOut';
    localStorage.removeItem('isLoggedIn');
    if (modalOpen) setModalOpen(false);
  };

  const checkTokenExpired = () => {
    if (!offline) {
      if ((state.expiresAt ?? 0) > 0) {
        const currentUnix = moment().locale('en').format('X');
        const expires = moment
          .unix(state?.expiresAt || 0)
          .locale('en')
          .format('X');
        const secondsLeft = Number(expires) - Number(currentUnix);
        if (secondsLeft < Expires + 30) {
          setSecondsToExpire(secondsLeft);
          if (!modalOpen) {
            setModalOpen(true);
          } else {
            view.current = '';
          }
        } else {
          if (modalOpen) setModalOpen(false);
        }
      }
    }
  };

  useInterval(checkTokenExpired, state?.expiresAt && !offline ? 5000 : null);

  const handleClose = (value: number) => {
    setModalOpen(false);
    if (value < 0) {
      view.current = 'Logout';
    } else {
      resetExpiresAt();
      setState((state) => ({
        ...state,
        expiresAt: state?.expiresAt ? state.expiresAt + 10 : 0,
      })); // allow time for refresh
      view.current = 'Continue';
    }
  };

  if (isLoading && !isElectron) {
    return <Busy />;
  }

  if (error && !isElectron) {
    console.log(error);
    if (errorReporter) logError(Severity.error, errorReporter, error);
    return <Busy />;
  }

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
  return (
    <TokenContext.Provider
      value={{
        state: {
          ...state,
          setAuthSession,
          logout,
          authenticated,
          resetExpiresAt,
        },
        setState,
      }}
    >
      {children}
    </TokenContext.Provider>
  );
}

export { TokenContext, TokenProvider };
