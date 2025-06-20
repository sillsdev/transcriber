import { remoteIdGuid } from '../crud';
import { useGlobal } from '../context/GlobalContext';
import { RecordKeyMap } from '@orbit/records';
import { logError, Severity } from '../utils/logErrorService';
import { waitForIt } from '../utils/waitForIt';
import { useSnackBar } from '../hoc/SnackBar';
import { IMediaTitleStrings } from '../model';
import { shallowEqual, useSelector } from 'react-redux';
import { mediaTitleSelector } from '../selector';

interface IProps {
  afterSave: (success: boolean) => void;
  onMediaIdChange: (mediaId: string) => void;
}

export const useTitleSave = (props: IProps) => {
  const { onMediaIdChange, afterSave } = props;
  const [memory] = useGlobal('memory');
  const [errorReporter] = useGlobal('errorReporter');
  const { showMessage } = useSnackBar();
  const [offlineOnly] = useGlobal('offlineOnly'); //will be constant here
  const t: IMediaTitleStrings = useSelector(mediaTitleSelector, shallowEqual);

  const uploadFailedMessage = (mediaId: string | undefined) => {
    logError(
      Severity.info,
      errorReporter,
      t.uploadFailStatus.replace('{0}', mediaId ?? '')
    );
    showMessage(t.uploadFailed);
    afterSave(false);
  };

  const afterUploadCb = async (mediaId: string | undefined) => {
    if (mediaId) {
      waitForIt(
        'mediaId',
        () =>
          offlineOnly ||
          remoteIdGuid('mediafile', mediaId, memory?.keyMap as RecordKeyMap) !==
            undefined,
        () => false,
        100
      )
        .then(() => {
          onMediaIdChange(
            remoteIdGuid(
              'mediafile',
              mediaId,
              memory?.keyMap as RecordKeyMap
            ) ?? mediaId
          );
          afterSave(true);
        })
        .catch(() => {
          uploadFailedMessage(mediaId);
        });
    } else uploadFailedMessage(mediaId);
  };

  return { afterUploadCb };
};
