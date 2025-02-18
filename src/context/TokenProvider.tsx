/* eslint-disable jsx-a11y/anchor-has-content */
import React, { useRef } from 'react';
import { User, useAuth0, RedirectLoginOptions } from '@auth0/auth0-react';
import { IToken } from '../model';
import Busy from '../components/Busy';
import TokenDialog from '../components/TokenDialog';
import moment from 'moment';
import jwtDecode from 'jwt-decode';
import { useGlobal } from '../context/GlobalContext';
import { useUpdateOrbitToken } from '../crud';
import { LocalKey, logError, Severity, useInterval } from '../utils';
import { isElectron } from '../api-variable';
import { useProjectDefaults } from '../crud/useProjectDefaults';
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
  setAuthSession: (profile: User | undefined, accessToken: string) => {},
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
  const { getLocalDefault } = useProjectDefaults();
  const options = {
    returnTo: getLocalDefault(LocalKey.deeplink),
  } as RedirectLoginOptions;
  const [state, setState] = React.useState({
    ...initState,
  });
  const expiresAtRef = useRef<number | null>(null);
  const setAuthSession = (profile: User | undefined, accessToken: string) => {
    if (accessToken) {
      const decodedToken = jwtDecode(accessToken) as IToken;
      expiresAtRef.current = decodedToken.exp;
    } else {
      expiresAtRef.current = null;
    }
    setState((state) => ({
      ...state,
      accessToken,
      profile,
      expiresAt: expiresAtRef.current,
      email_verified: profile?.email_verified,
    }));
    localStorage.setItem(LocalKey.loggedIn, 'true');
  };

  React.useEffect(() => {
    //this is only called on web
    if (isAuthenticated && user) {
      getAccessTokenSilently()
        .then((token) => {
          updateOrbitToken(token);
          setAuthSession(user, token);
        })
        .catch((e: any) => {
          handleLogOut();
          loginWithRedirect(options);
        });
    }
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
    if (timeUntilExpire() < 0) return false;
    return true;
  };

  const resetExpiresAt = () => {
    if (offline) return;
    if (isElectron) {
      ipc
        ?.refreshToken()
        .then(async () => {
          const myUser = await ipc?.getProfile();
          const myToken = await ipc?.getToken();
          updateOrbitToken(myToken);
          setAuthSession(myUser, myToken);
        })
        .catch((e: Error) => {
          localStorage.setItem(LocalKey.offlineAdmin, 'false');
          localStorage.removeItem(LocalKey.userId);
          handleLogOut();
          logError(Severity.error, errorReporter, e);
        });
    } else {
      getAccessTokenSilently()
        .then((token) => {
          updateOrbitToken(token);
          setAuthSession(user, token);
        })
        .catch((e: any) => {
          console.log(
            'token error',
            JSON.stringify(e),
            window?.location?.pathname
          );
          if (e.error === 'login_required' && window?.location?.pathname) {
            localStorage.setItem(LocalKey.deeplink, window?.location?.pathname);
          }
          handleLogOut();
          logError(Severity.error, errorReporter, e);
          loginWithRedirect(options);
        });
    }
  };

  React.useEffect(() => {
    if (!offline) {
      if (localStorage.getItem(LocalKey.loggedIn) === 'true') {
        resetExpiresAt();
      }
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  const handleLogOut = () => {
    setState((state) => ({ ...state, expiresAt: -1 }));
    view.current = 'loggedOut';
    localStorage.removeItem(LocalKey.loggedIn);
    if (modalOpen) setModalOpen(false);
  };

  const timeUntilExpire = () => {
    if (!expiresAtRef.current) return -1;
    const currentUnix = moment().locale('en').format('X');
    const expires = moment
      .unix(expiresAtRef.current || 0)
      .locale('en')
      .format('X');
    const secondsLeft = Number(expires) - Number(currentUnix);
    return secondsLeft;
  };

  const checkTokenExpired = () => {
    if (!offline) {
      if ((expiresAtRef.current ?? 0) > 0) {
        const secondsLeft = timeUntilExpire();
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
    setTimeout(() => {
      loginWithRedirect(options);
    }, 1000);
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
