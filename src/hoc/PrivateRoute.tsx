import { useContext } from 'react';
import { useGlobal } from '../mods/reactn';
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
  const { authenticated } = useContext(TokenContext).state;

  if (typeof pathname === 'string' && pathname !== '/loading')
    localStorage.setItem(localUserKey(LocalKey.deeplink), pathname);
  if (!pathname?.endsWith('null'))
    localStorage.setItem(localUserKey(LocalKey.url), pathname);
  if (!offline && !authenticated())
    navigate('/', { state: { from: pathname } });

  return el;
}
export default PrivateRoute;
