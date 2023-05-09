/* eslint-disable jsx-a11y/anchor-has-content */
import { useState, useContext, useEffect, useRef } from 'react';
import { IMainStrings, IState } from '../model';
import { useSelector, shallowEqual, useDispatch } from 'react-redux';
import * as actions from '../store';
import {
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  styled,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { logError, Severity, forceLogin, useMyNavigate } from '../utils';
import { PriButton } from '../control';
import { TokenContext } from '../context/TokenProvider';
import { mainSelector } from '../selector';
import { useGlobal } from 'reactn';
import JSONAPISource from '@orbit/jsonapi';
import { useRouteError } from 'react-router-dom';
import { isElectron } from '../api-variable';
import { useLogoutResets } from '../utils/useLogoutResets';

const ModalDiv = styled('div')(() => ({
  position: 'fixed' /* Stay in place */,
  zIndex: 1 /* Sit on top */,
  paddingTop: '100px' /* Location of the box */,
  left: 0,
  top: 0,
  width: '100%' /* Full width */,
  height: '100%' /* Full height */,
  overflow: 'auto' /* Enable scroll if needed */,
  backgroundColor: 'rgba(0, 0, 0, 0.4)' /* Black w/ opacity */,
}));

const ModalContentDiv = styled('div')(() => ({
  backgroundColor: '#fefefe',
  margin: 'auto',
  padding: '20px',
  border: '1px solid #888',
  width: '80%',
  height: '40%',
  textAlign: 'center',
  display: 'flex',
  flexDirection: 'column',
  '& #detail': {
    textAlign: 'left',
    fontSize: 'small',
  },
}));

const ModalActionsDiv = styled('div')(() => ({
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'center',
}));

const ErrorPageDiv = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  margin: theme.spacing(4),
  width: '100%',
}));

const initState = {
  errCount: 0,
  error: '',
  details: '',
  view: '',
};

interface ModalProps {
  message: JSX.Element | string;
  details?: string;
  state: typeof initState;
  resetState: () => void;
}

export const ModalMessage = (props: ModalProps) => {
  const { message, details, state, resetState } = props;
  const [expanded, setExpanded] = useState(false);
  const t: IMainStrings = useSelector(mainSelector, shallowEqual);
  const ctx = useContext(TokenContext).state;
  const orbitStatus = useSelector((state: IState) => state.orbit.status);
  const dispatch = useDispatch();
  const resetOrbitError = () => dispatch(actions.resetOrbitError());
  const [coordinator] = useGlobal('coordinator');
  const remote = coordinator.getSource('remote') as JSONAPISource;
  const logoutRef = useRef<any>();
  const logoutResets = useLogoutResets();

  const resetRequests = async () => {
    return await remote?.requestQueue?.clear();
  };

  const nextStep = async (goNext: string) => {
    if (goNext === '/logout') {
      await logoutResets();
      if (isElectron) {
        ctx.logout();
      } else {
        forceLogin();
        logoutRef.current?.click();
      }
    } else {
      resetState();
    }
  };

  const cleanUpAndGo = (goNext: string) => () => {
    if (remote?.requestQueue) {
      resetRequests().finally(() => {
        resetOrbitError(); //this resets state and sends us back to loading
        nextStep(goNext);
      });
    } else {
      nextStep(goNext);
    }
  };

  const handleChange = () => {
    setExpanded(!expanded);
  };

  return (
    <ModalDiv id="myModal" key={state.errCount}>
      <ModalContentDiv>
        <Typography>{t.crashMessage}</Typography>
        {message}
        {(details || state.details) && (
          <Accordion expanded={expanded} onChange={handleChange}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              {t.details}
            </AccordionSummary>
            <AccordionDetails id="detail">
              {details || state.details}
            </AccordionDetails>
          </Accordion>
        )}
        <ModalActionsDiv>
          {orbitStatus !== 401 && (
            <PriButton id="errCont" onClick={cleanUpAndGo('')}>
              {t.continue}
            </PriButton>
          )}
          <PriButton id="errLogout" onClick={cleanUpAndGo('/logout')}>
            {t.logout}
          </PriButton>
        </ModalActionsDiv>
      </ModalContentDiv>
      <a ref={logoutRef} href="/logout"></a>
    </ModalDiv>
  );
};

export const ErrorPage = () => {
  const [state, setState] = useState(initState);
  const orbitStatus = useSelector((state: IState) => state.orbit.status);
  const orbitMessage = useSelector((state: IState) => state.orbit.message);
  const orbitDetails = useSelector((state: IState) => state.orbit.details);
  const [errorReporter] = useGlobal('errorReporter');
  const [offlineOnly, setOfflineOnly] = useGlobal('offlineOnly');
  const t: IMainStrings = useSelector(mainSelector, shallowEqual);
  const error = useRouteError() as any as Error;
  const ctx = useContext(TokenContext).state;
  const logoutRef = useRef<any>();
  const logoutResets = useLogoutResets();
  const [view, setView] = useState('');
  const navigate = useMyNavigate();

  const logout = async () => {
    const wasOfflineOnly = offlineOnly;
    if (offlineOnly) setOfflineOnly(false);
    await logoutResets();
    if (!isElectron) {
      forceLogin();
      logoutRef.current?.click();
    }
    if (!wasOfflineOnly) {
      localStorage.setItem('offlineAdmin', 'false');
      localStorage.removeItem('user-id');
    }
    setView(wasOfflineOnly ? 'offline' : 'online');
  };

  useEffect(() => {
    if (!state.errCount) {
      logError(Severity.error, errorReporter, {
        message: error.message,
        name: 'Caught error',
        opts: {
          stack: error.stack,
          componentStack: error.stack,
        },
      } as any);
    }
    console.error(error);
    if (error.message === 'Error: Login required') {
      ctx.resetExpiresAt();
    } else {
      setState({
        ...state,
        errCount: state.errCount + 1,
        error: (error as any)?.error?.toString() ?? error.message,
        details: (error as any)?.opts?.stack ?? error.stack ?? '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]);

  const handleReset = () => {
    setState(initState);
  };

  if (/online|offline/i.test(view)) navigate(`/access/${view}`);

  if (state.errCount && localStorage.getItem('isLoggedIn')) {
    return (
      <ModalMessage
        message={state?.error || 'Error count > 0'}
        state={state}
        resetState={handleReset}
      />
    );
  }

  if (orbitStatus && orbitStatus >= 400) {
    logError(Severity.error, errorReporter, {
      message: orbitMessage,
      name: orbitStatus.toString(),
    });
    return (
      <ModalMessage
        message={
          <>
            {t.apiError + ' ' + orbitStatus.toString()}
            <br />
            {orbitMessage}
          </>
        }
        details={orbitDetails}
        state={state}
        resetState={handleReset}
      />
    );
  } else if (orbitStatus === Severity.info) {
    logError(Severity.info, errorReporter, orbitMessage);
  }

  // If there is no error just render the children component.
  return (
    <ErrorPageDiv>
      <h1>Oops!</h1>
      <p>Sorry, an unexpected error has occurred.</p>
      <p>
        <i>{(error as any)?.statusText || error.message}</i>
      </p>
      <div>{(error as any)?.componentStack || error.stack || ''}</div>
      <PriButton id="err-start" onClick={logout}>
        {t.logout}
      </PriButton>
      <a ref={logoutRef} href="/logout"></a>
    </ErrorPageDiv>
  );
};
