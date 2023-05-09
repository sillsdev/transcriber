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
  const { authenticated } = useContext(TokenContext).state;

  if (!pathname?.endsWith('null') && pathname !== '/loading')
    localStorage.setItem(localUserKey(LocalKey.url), pathname);
  if (!offline && !authenticated())
    navigate('/', { state: { from: pathname } });

  return el;
}
export default PrivateRoute;
