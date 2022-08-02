import { useEffect, useRef } from 'react';
import { useGlobal } from 'reactn';
import { useFetchMediaUrl, MediaSt } from '../crud';
import { useSnackBar } from '../hoc/SnackBar';
import { ISharedStrings } from '../model';
import { sharedSelector } from '../selector';
import { shallowEqual, useSelector } from 'react-redux';
import { ExternalLink, LaunchFn } from './ExternalLink';

interface IProps {
  srcMediaId: string;
  finish: () => void;
}

export function MediaDisplay(props: IProps) {
  const { srcMediaId, finish } = props;
  const [reporter] = useGlobal('errorReporter');
  const { fetchMediaUrl, mediaState } = useFetchMediaUrl(reporter);
  const launch = useRef<LaunchFn>();
  const { showMessage } = useSnackBar();
  const ts: ISharedStrings = useSelector(sharedSelector, shallowEqual);

  const register = (fn?: LaunchFn) => {
    launch.current = fn;
  };

  useEffect(() => {
    if (srcMediaId && mediaState.id !== srcMediaId) {
      fetchMediaUrl({ ...props, id: srcMediaId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [srcMediaId]);

  useEffect(() => {
    if (!srcMediaId || mediaState.id !== srcMediaId) return;
    if (mediaState.status === MediaSt.FETCHED) {
      if (launch.current) launch.current(mediaState.url);
    } else if (mediaState.error) {
      if (mediaState.error.startsWith('no offline file'))
        showMessage(ts.fileNotFound);
      else showMessage(mediaState.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaState]);

  return <ExternalLink register={register} finish={finish} />;
}
export default MediaDisplay;
