import { useGlobal } from '../mods/reactn';
import * as actions from '../store';
import Axios from 'axios';
import JSONAPISource from '@orbit/jsonapi';
import { OrbitNetworkErrorRetries } from '../api-variable';
import { API_CONFIG } from '../api-variable';
import { useDispatch } from 'react-redux';

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
  const [offlineOnly] = useGlobal('offlineOnly');
  const remote = coordinator.getSource('remote') as JSONAPISource;

  const checkOnline = (
    cb: (result: boolean) => void,
    forceCheck: boolean = false
  ) => {
    Online(forceCheck || !offlineOnly, (result) => {
      if (connected !== result) {
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
