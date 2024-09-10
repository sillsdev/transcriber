import { useEffect, useRef } from 'react';
import { isElectron } from '../api-variable';
import { useGlobal } from 'reactn';
import { launch } from '../utils';

interface DoLinkProps {
  url: string | undefined;
}
export const LaunchLink = ({ url }: DoLinkProps) => {
  const linkRef = useRef<HTMLAnchorElement>(null);
  const [isOffline] = useGlobal('offline');

  const doLink = (link: string | undefined) => {
    if (!link) return;
    if (isElectron) {
      launch(link, !isOffline);
    } else {
      linkRef.current?.setAttribute('href', link);
      linkRef.current?.click();
    }
  };

  useEffect(() => {
    if (url) {
      doLink(url);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  return (
    <>
      {/* eslint-disable-next-line jsx-a11y/anchor-has-content, jsx-a11y/anchor-is-valid */}
      <a ref={linkRef} href="#" target="_blank" rel="noopener noreferrer"></a>
    </>
  );
};
