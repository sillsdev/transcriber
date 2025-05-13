import { useGetGlobal, useGlobal } from '../context/GlobalContext';
import * as actions from '../store';
import Axios from 'axios';
import JSONAPISource from '@orbit/jsonapi';
import { OrbitNetworkErrorRetries } from '../api-variable';
import { API_CONFIG } from '../api-variable';
import { useDispatch } from 'react-redux';
import { LocalKey } from '../utils';
import Bugsnag from '@bugsnag/js';

export function Online(doCheck: boolean, cb: (result: boolean) => void) {
  const opts = {
    timeout: 10000,
  };

  //if we're electron, don't be using the internet even if it's available
  //until the user logs in or the override is true
  if (!doCheck) {
    cb(false);
  }

  Axios.get(API_CONFIG.host + '/api/AmIOnline/', opts)
    .then(() => {
      cb(true);
    })
    .catch((reason) => {
      cb(reason.response !== undefined);
    });
}
export const useCheckOnline = (label: string) => {
  const dispatch = useDispatch();
  const resetOrbitError = actions.resetOrbitError;
  const getGlobal = useGetGlobal();
  const [, setConnected] = useGlobal('connected');
  const [, setOrbitRetries] = useGlobal('orbitRetries');
  const [coordinator] = useGlobal('coordinator');
  const remote = coordinator?.getSource('remote') as JSONAPISource;

  const checkOnline = (
    cb: (result: boolean) => void,
    forceCheck: boolean = false
  ) => {
    if (!forceCheck && getGlobal('offline')) {
      localStorage.setItem(LocalKey.connected, 'false');
    }
    //console.log('Checking online status for ' + label);
    Online(forceCheck || !getGlobal('offline'), (result) => {
      if (getGlobal('connected') !== result) {
        localStorage.setItem(
          LocalKey.connected,
          `${result && !getGlobal('offline')}`
        );
        if (API_CONFIG.snagId !== '') {
          if (result) {
            Bugsnag.resumeSession();
          } else {
            Bugsnag.pauseSession();
          }
        }
        setConnected(result);
        if (result) {
          dispatch(resetOrbitError());
          if (getGlobal('orbitRetries') < OrbitNetworkErrorRetries) {
            remote.requestQueue?.retry();
            setOrbitRetries(OrbitNetworkErrorRetries);
          }
        }
      }
      cb(result);
    });
  };
  return checkOnline;
};
