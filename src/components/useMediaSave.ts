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
import { waitForIt } from '../utils';

interface IProps {
  myPlanId?: string;
  passageId?: string;
  reset?: () => void;
  onMediaIdChange: (mediaId: string) => void;
  onDialogVisible?: (show: boolean) => void;
  setUploadSuccess: (success: boolean | undefined) => void;
}

export const useMediaSave = (props: IProps) => {
  const {
    myPlanId,
    passageId,
    onMediaIdChange,
    onDialogVisible,
    reset,
    setUploadSuccess,
  } = props;
  const [memory] = useGlobal('memory');
  const [offlineOnly] = useGlobal('offlineOnly'); //will be constant here
  const { getTypeId } = useArtifactType();

  const TitleId = useMemo(() => {
    var id = getTypeId(ArtifactTypeSlug.Title) as string;
    return remoteId('artifacttype', id, memory?.keyMap as RecordKeyMap) || id;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offlineOnly]);

  const afterUploadCb = async (mediaId: string) => {
    onDialogVisible?.(false);
    if (mediaId) {
      waitForIt(
        'mediaId',
        () =>
          offlineOnly ||
          remoteIdGuid('mediafile', mediaId, memory?.keyMap as RecordKeyMap) !==
            undefined,
        () => false,
        100
      ).then(() => {
        onMediaIdChange(
          remoteIdGuid('mediafile', mediaId, memory?.keyMap as RecordKeyMap) ??
            mediaId
        );
        reset?.();
      });
    } else reset?.();
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
