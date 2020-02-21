import Axios from 'axios';
import { API_CONFIG } from '../api-variable';

export function Online(cb: (result: boolean) => void) {
  Axios.get(API_CONFIG.host + '/api/projects/', { timeout: 5000 }).catch(
    reason => {
      cb(reason.response !== undefined);
    }
  );
}
export default Online;
