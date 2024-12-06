import { useEffect, useRef } from 'react';
import { isElectron } from '../api-variable';
import { launch } from '../utils';
import { ISharedStrings } from '../model';
import { useSelector, shallowEqual } from 'react-redux';
import { sharedSelector } from '../selector';
import { useSnackBar } from '../hoc/SnackBar';
import { Online } from '../utils/useCheckOnline';

interface DoLinkProps {
  url: string | undefined;
  reset?: () => void;
}
export const LaunchLink = ({ url, reset }: DoLinkProps) => {
  const linkRef = useRef<HTMLAnchorElement>(null);
  const { showMessage } = useSnackBar();
  const ts: ISharedStrings = useSelector(sharedSelector, shallowEqual);

  const doLink = (link: string | undefined) => {
    if (!link) return;
    Online(true, (isOnline) => {
      if (!isOnline) {
        showMessage(ts.mustBeOnline);
        reset && reset();
        return;
      }
      if (isElectron) {
        launch(link, isOnline).then(() => reset && reset());
      } else {
        linkRef.current?.setAttribute('href', link);
        linkRef.current?.click();
        reset && setTimeout(() => reset(), 1000);
      }
    });
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
