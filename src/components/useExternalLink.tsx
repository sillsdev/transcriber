/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable jsx-a11y/anchor-has-content */
import React from 'react';
import { useGlobal } from 'reactn';
import { isElectron } from '../api-variable';
import { launch } from '../utils';

export const useExternalLink = () => {
  const [isOffline] = useGlobal('offline');
  const externalRef = React.useRef<any>();
  const [externalUrl, setExternalUrl] = React.useState<string>();

  const handleLaunch = (target: string) => () => {
    if (isElectron) {
      launch(target, !isOffline);
    } else {
      setExternalUrl(target);
    }
  };

  interface ILinkProps {
    externalUrl: string | undefined;
  }

  const ExternalLink = ({ externalUrl }: ILinkProps) => {
    return (
      <a
        ref={externalRef}
        href={externalUrl || '#'}
        target="_blank"
        rel="noopener noreferrer"
      ></a>
    );
  };

  React.useEffect(() => {
    if (externalRef.current && externalUrl) {
      externalRef.current.click();
      setExternalUrl(undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalUrl]);

  return { handleLaunch, ExternalLink, externalUrl };
};
