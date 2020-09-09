import Axios from 'axios';
import { API_CONFIG, isElectron } from '../api-variable';
import Auth from '../auth/Auth';

export function Online(
  cb: (result: boolean) => void,
  auth?: Auth,
  electronCheck?: boolean //set this to true to see if electron CAN OFFER LOGIN
) {
  const opts =
    auth && auth.accessToken
      ? {
          headers: {
            Authorization: 'Bearer ' + auth.accessToken,
          },
          timeout: 5000,
        }
      : {
          timeout: 5000,
        };

  //if we're electron, don't be using the internet even if it's available
  //until the user logs in or the override is true
  if (!electronCheck && isElectron && !auth?.accessToken) {
    cb(false);
    return;
  }

  Axios.get(API_CONFIG.host + '/api/dashboards/', opts)
    .then(() => {
      cb(true);
    })
    .catch((reason) => {
      cb(reason.response !== undefined);
    });
}
export default Online;
