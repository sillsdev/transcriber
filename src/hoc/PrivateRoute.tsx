import { useContext } from 'react';
import { useGlobal } from 'reactn';
import { useLocation, useNavigate } from 'react-router-dom';
import { TokenContext } from '../context/TokenProvider';
import { LocalKey, localUserKey } from '../utils';

interface IProps {
  el: JSX.Element;
}

export function PrivateRoute({ el }: IProps) {
  const [offline] = useGlobal('offline');
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useContext(TokenContext).state;

  if (typeof pathname === 'string')
    localStorage.setItem(localUserKey(LocalKey.deeplink), pathname);
  if (!pathname?.endsWith('null'))
    localStorage.setItem(localUserKey(LocalKey.url), pathname);
  if (!offline && !isAuthenticated)
    navigate('/', { state: { from: pathname } });

  return el;
}
export default PrivateRoute;
