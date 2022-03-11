import { useState, useEffect, useRef } from 'react';
import Auth from '../auth/Auth';
import { useGlobal } from 'reactn';
import { useFetchMediaUrl, MediaSt } from '../crud';
import { isElectron } from '../api-variable';
import { launch } from '../utils';
import { useSnackBar } from '../hoc/SnackBar';
import { ISharedStrings } from '../model';
import { sharedSelector } from '../selector';
import { shallowEqual, useSelector } from 'react-redux';

interface IProps {
  auth: Auth | null;
  srcMediaId: string;
  finish: () => void;
}

export function MediaDisplay(props: IProps) {
  const { srcMediaId, finish } = props;
  const [isOffline] = useGlobal('offline');
  const [reporter] = useGlobal('errorReporter');
  const { fetchMediaUrl, mediaState } = useFetchMediaUrl(reporter);
  const externalRef = useRef<any>();
  const [externalUrl, setExternalUrl] = useState<string>('#');
  const { showMessage } = useSnackBar();
  const ts: ISharedStrings = useSelector(sharedSelector, shallowEqual);

  const handleLaunch = (target: string) => {
    if (isElectron) {
      launch(target, !isOffline);
    } else {
      setExternalUrl(target);
    }
  };

  useEffect(() => {
    if (srcMediaId && mediaState.id !== srcMediaId) {
      fetchMediaUrl({ ...props, id: srcMediaId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [srcMediaId]);

  useEffect(() => {
    if (!srcMediaId || mediaState.id !== srcMediaId) return;
    if (mediaState.status === MediaSt.FETCHED) handleLaunch(mediaState.url);
    else if (mediaState.error) {
      if (mediaState.error.startsWith('no offline file'))
        showMessage(ts.fileNotFound);
      else showMessage(mediaState.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaState]);

  useEffect(() => {
    if (externalRef.current && externalUrl !== '#') {
      externalRef.current.click();
      setExternalUrl('#');
      finish();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalUrl]);

  return (
    // eslint-disable-next-line jsx-a11y/anchor-has-content
    <a
      ref={externalRef}
      href={externalUrl}
      target="_blank"
      rel="noopener noreferrer"
    ></a>
  );
}
export default MediaDisplay;
