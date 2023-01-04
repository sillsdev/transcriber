import { useContext } from 'react';
import { useGlobal } from 'reactn';
import { useLocation } from 'react-router-dom';
import { TokenContext } from '../context/TokenProvider';
import { LocalKey, localUserKey, useMyNavigate } from '../utils';

interface IProps {
  el: JSX.Element;
}

export function PrivateRoute({ el }: IProps) {
  const [offline] = useGlobal('offline');
  const { pathname } = useLocation();
  const navigate = useMyNavigate();
  const { isAuthenticated } = useContext(TokenContext).state;

  if (typeof pathname === 'string' && pathname !== '/loading')
    localStorage.setItem(LocalKey.deeplink, pathname);
  if (!pathname?.endsWith('null'))
    localStorage.setItem(localUserKey(LocalKey.url), pathname);
  if (!offline && !isAuthenticated)
    navigate('/', { state: { from: pathname } });

  return el;
}
export default PrivateRoute;
