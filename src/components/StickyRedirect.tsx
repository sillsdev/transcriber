import React, { useEffect } from 'react';
import { useGlobal } from 'reactn';
import { Redirect } from 'react-router-dom';
import { isElectron } from '../api-variable';
import { logError, Severity } from '../utils';
import { LocalKey, localUserKey } from '../utils/localUserKey';

interface IProps {
  to: string;
}

export const StickyRedirect = ({ to }: IProps) => {
  const [reporter] = useGlobal('errorReporter');
  const [memory] = useGlobal('memory');

  useEffect(() => {
    localStorage.setItem(localUserKey(LocalKey.url, memory), to);
    if (isElectron) logError(Severity.info, reporter, to);
  }, [memory, reporter, to]);

  return <Redirect to={to} />;
};

export default StickyRedirect;
