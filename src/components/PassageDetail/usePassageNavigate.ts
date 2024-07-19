import { useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { UnsavedContext } from '../../context/UnsavedContext';
import { LocalKey, localUserKey, useMyNavigate } from '../../utils';

export const usePassageNavigate = (
  cb: () => void,
  setCurrentStep: (step: string) => void
) => {
  const { pathname } = useLocation();
  const navigate = useMyNavigate();
  //const { setCurrentStep } = usePassageDetailContext();
  const { checkSavedFn } = useContext(UnsavedContext).state;

  return (view: string) => {
    if (view && view !== pathname) {
      checkSavedFn(() => {
        if (!view.endsWith('null'))
          localStorage.setItem(localUserKey(LocalKey.url), view);
        setTimeout(() => {
          navigate(view);
          setTimeout(() => {
            // Jump to first uncompleted step
            setCurrentStep('');
          }, 500); // go to first step
        }, 500); // go to next passage
        cb();
      });
    }
  }; // Make sure this step is complete
};
