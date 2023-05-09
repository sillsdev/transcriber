import { useGlobal } from 'reactn';
import * as actions from '../store';
import Axios from 'axios';
import JSONAPISource from '@orbit/jsonapi';
import { OrbitNetworkErrorRetries } from '../api-variable';
import { API_CONFIG } from '../api-variable';
import { useDispatch } from 'react-redux';
import { LocalKey } from '../utils';

function Online(doCheck: boolean, cb: (result: boolean) => void) {
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
export const useCheckOnline = () => {
  const dispatch = useDispatch();
  const resetOrbitError = actions.resetOrbitError;
  const [connected, setConnected] = useGlobal('connected');
  const [orbitRetries, setOrbitRetries] = useGlobal('orbitRetries');
  const [coordinator] = useGlobal('coordinator');
  const [offline] = useGlobal('offline');
  const remote = coordinator.getSource('remote') as JSONAPISource;

  const checkOnline = (
    cb: (result: boolean) => void,
    forceCheck: boolean = false
  ) => {
    Online(forceCheck || !offline, (result) => {
      if (connected !== result) {
        localStorage.setItem(LocalKey.connected, `${result && !offline}`);
        setConnected(result);
        if (result) {
          dispatch(resetOrbitError());
          if (orbitRetries < OrbitNetworkErrorRetries) {
            remote.requestQueue.retry();
            setOrbitRetries(OrbitNetworkErrorRetries);
          }
        }
      }
      cb(result);
    });
  };
  return checkOnline;
};
