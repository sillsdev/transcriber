import { NavigateOptions, To, useNavigate } from 'react-router-dom';
import { useHome } from './useHome';

export const useMyNavigate = () => {
  const navigate = useNavigate();
  const { checkHome } = useHome();

  function myNavigate(to: To, options?: NavigateOptions) {
    checkHome(to);
    setTimeout(() => {
      navigate(to, options);
    }, 200);
  }
  return myNavigate;
};
