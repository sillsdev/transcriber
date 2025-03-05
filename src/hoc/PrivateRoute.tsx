import { useContext } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { useLocation } from 'react-router-dom';
import { TokenContext } from '../context/TokenProvider';
import { LocalKey, localUserKey, useMyNavigate } from '../utils';

interface IProps {
  el: JSX.Element;
}

export function PrivateRoute({ el }: IProps) {
  const [offline] = useGlobal('offline'); //verified this is not used in a function 2/18/25
  const { pathname } = useLocation();
  const navigate = useMyNavigate();
  const { authenticated } = useContext(TokenContext).state;

  if (
    !pathname?.endsWith('null') &&
    pathname !== '/loading' &&
    pathname !== '/profile'
  )
    localStorage.setItem(localUserKey(LocalKey.url), pathname);
  if (!offline && !authenticated())
    navigate('/', { state: { from: pathname } });
  
  return el;
}
export default PrivateRoute;
