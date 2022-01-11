import { useEffect } from 'react';
import { useGlobal } from 'reactn';
import { useHistory, useLocation } from 'react-router-dom';
import { LocalKey, localUserKey } from '../utils/localUserKey';

interface IProps {
  to: string;
}

export const StickyRedirect = ({ to }: IProps) => {
  const { push, replace } = useHistory();
  const { pathname } = useLocation();
  const [reporter] = useGlobal('errorReporter');
  const [memory] = useGlobal('memory');

  useEffect(() => {
    localStorage.setItem(localUserKey(LocalKey.url), to);
    if (
      to.length > 4 &&
      pathname.length > 4 &&
      to.slice(0, 4) === pathname.slice(0, 4)
    )
      replace(to);
    else push(to);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memory, reporter, to]);

  return <></>;
};

export default StickyRedirect;
