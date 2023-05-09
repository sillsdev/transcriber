import { useContext } from 'react';
import { useLocation } from 'react-router-dom';
import usePassageDetailContext from '../../context/usePassageDetailContext';
import { UnsavedContext } from '../../context/UnsavedContext';
import { LocalKey, localUserKey, useMyNavigate } from '../../utils';

export const usePassageNavigate = (cb: () => void) => {
  const { pathname } = useLocation();
  const navigate = useMyNavigate();
  const { setCurrentStep } = usePassageDetailContext();
  const { checkSavedFn } = useContext(UnsavedContext).state;

  return (view: string) => {
    setTimeout(() => {
      if (view) {
        if (view !== pathname) {
          checkSavedFn(() => {
            if (!view.endsWith('null'))
              localStorage.setItem(localUserKey(LocalKey.url), view);
            navigate(view);
            cb();
            // Jump to first uncompleted step
            setCurrentStep('');
          });
        }
      }
    }, 1000);
  };
};
