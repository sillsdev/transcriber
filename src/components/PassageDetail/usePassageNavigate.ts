import { useContext } from 'react';
import { useLocation, useHistory } from 'react-router-dom';
import usePassageDetailContext from '../../context/usePassageDetailContext';
import { UnsavedContext } from '../../context/UnsavedContext';
import { LocalKey, localUserKey } from '../../utils';

export const usePassageNavigate = (cb: () => void) => {
  const { pathname } = useLocation();
  const { push } = useHistory();
  const { setCurrentStep } = usePassageDetailContext();
  const { checkSavedFn } = useContext(UnsavedContext).state;

  return (view: string) => {
    setTimeout(() => {
      if (view) {
        if (view !== pathname) {
          checkSavedFn(() => {
            localStorage.setItem(localUserKey(LocalKey.url), view);
            push(view);
            cb();
            // Jump to first uncompleted step
            setCurrentStep('');
          });
        }
      }
    }, 1000);
  };
};
