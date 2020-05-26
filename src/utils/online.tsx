import Axios from 'axios';
import { API_CONFIG } from '../api-variable';
import Auth from '../auth/Auth';

export function Online(cb: (result: boolean) => void, auth?: Auth) {
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

  Axios.get(API_CONFIG.host + '/api/roles/', opts)
    .then(() => {
      cb(true);
    })
    .catch((reason) => {
      cb(reason.response !== undefined);
    });
}
export default Online;
