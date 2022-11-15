import { useEffect } from 'react';
import { useGlobal } from 'reactn';
import { useNavigate, useLocation } from 'react-router-dom';
import { LocalKey, localUserKey } from '../utils/localUserKey';

interface IProps {
  to: string;
}

export const StickyRedirect = ({ to }: IProps) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [reporter] = useGlobal('errorReporter');
  const [memory] = useGlobal('memory');

  useEffect(() => {
    if (!to.endsWith('null'))
      localStorage.setItem(localUserKey(LocalKey.url), to);
    if (
      to.length > 4 &&
      pathname.length > 4 &&
      to.slice(0, 4) === pathname.slice(0, 4)
    )
      navigate(to, { replace: true });
    else navigate(to);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memory, reporter, to]);

  return <></>;
};

export default StickyRedirect;
