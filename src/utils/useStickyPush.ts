import { useGlobal } from 'reactn';
import { useHistory } from 'react-router-dom';
import { isElectron } from '../api-variable';
import { logError, Severity } from '.';

export const useStickyRedirect = () => {
  const { push } = useHistory();
  const [reporter] = useGlobal('errorReporter');

  return (to: string) => {
    localStorage.setItem('fromUrl', to);
    if (isElectron) logError(Severity.info, reporter, to);
    push(to);
  };
};
