import { useGlobal } from 'reactn';
import { useHistory } from 'react-router-dom';
import { isElectron } from '../api-variable';
import { logError, Severity } from '.';
import { LocalKey, localUserKey } from './localUserKey';

export const useStickyRedirect = () => {
  const { push } = useHistory();
  const [reporter] = useGlobal('errorReporter');
  const [memory] = useGlobal('memory')

  return (to: string) => {
    localStorage.setItem(localUserKey(LocalKey.url, memory), to);
    if (isElectron) logError(Severity.info, reporter, to);
    push(to);
  };
};
