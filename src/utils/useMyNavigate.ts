import { NavigateOptions, To, useNavigate } from 'react-router-dom';
import { useHome } from './useHome';
import { useEffect, useState } from 'react';

export const useMyNavigate = () => {
  const navigate = useNavigate();
  const { checkHome } = useHome();
  const [goTo, setGoTo] = useState<{
    to: To;
    options: NavigateOptions | undefined;
  }>();

  useEffect(() => {
    if (goTo) navigate(goTo.to, goTo.options);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goTo]);

  function myNavigate(to: To, options?: NavigateOptions) {
    checkHome(to);
    if (to !== goTo?.to) setGoTo({ to, options });
  }
  return myNavigate;
};
