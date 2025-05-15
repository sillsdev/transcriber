import { useMemo } from 'react';
import {
  ArtifactTypeSlug,
  remoteId,
  remoteIdGuid,
  useArtifactType,
  useMediaUpload,
  VernacularTag,
} from '../crud';
import { useGlobal } from '../context/GlobalContext';
import { RecordKeyMap } from '@orbit/records';
import { logError, Severity } from '../utils/logErrorService';
import { waitForIt } from '../utils/waitForIt';
import { useSnackBar } from '../hoc/SnackBar';
import { IMediaTitleStrings } from '../model';
import { shallowEqual, useSelector } from 'react-redux';
import { mediaTitleSelector } from '../selector';

interface IProps {
  myPlanId?: string;
  passageId?: string;
  reset?: () => void;
  onMediaIdChange: (mediaId: string) => void;
  onDialogVisible?: (show: boolean) => void;
  setUploadSuccess: (success: boolean | undefined) => void;
}

export const useTitleSave = (props: IProps) => {
  const {
    myPlanId,
    passageId,
    onMediaIdChange,
    onDialogVisible,
    reset,
    setUploadSuccess,
  } = props;
  const [memory] = useGlobal('memory');
  const [errorReporter] = useGlobal('errorReporter');
  const [offlineOnly] = useGlobal('offlineOnly'); //will be constant here
  const { getTypeId } = useArtifactType();
  const { showMessage } = useSnackBar();
  const t: IMediaTitleStrings = useSelector(mediaTitleSelector, shallowEqual);

  const TitleId = useMemo(() => {
    var id = getTypeId(ArtifactTypeSlug.Title) as string;
    return remoteId('artifacttype', id, memory?.keyMap as RecordKeyMap) || id;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offlineOnly]);

  const uploadFailedMessage = (mediaId: string) => {
    logError(
      Severity.info,
      errorReporter,
      t.uploadFailStatus.replace('{0}', mediaId)
    );
    showMessage(t.uploadFailed);
    setUploadSuccess(false);
  };

  const afterUploadCb = async (mediaId: string) => {
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
          onDialogVisible?.(false);
          onMediaIdChange(
            remoteIdGuid(
              'mediafile',
              mediaId,
              memory?.keyMap as RecordKeyMap
            ) ?? mediaId
          );
          reset?.();
        })
        .catch(() => {
          uploadFailedMessage(mediaId);
        });
    } else uploadFailedMessage(mediaId);
  };

  const uploadMedia = useMediaUpload({
    artifactId: passageId !== undefined ? VernacularTag : TitleId,
    passageId: passageId,
    planId: myPlanId,
    afterUploadCb,
    setUploadSuccess,
  });

  return { uploadMedia };
};
