import { useRef, useContext, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import * as actions from '../store';
import JSONAPISource from '@orbit/jsonapi';
import IndexedDBSource from '@orbit/indexeddb';
import {
  ArtifactTypeSlug,
  pullTableList,
  remoteId,
  remoteIdGuid,
  remoteIdNum,
  useArtifactType,
  useOfflnMediafileCreate,
  VernacularTag,
} from '../crud';
import { useGetGlobal, useGlobal } from '../context/GlobalContext';
import { TokenContext } from '../context/TokenProvider';
import { UploadType } from './MediaUpload';
import { RecordKeyMap } from '@orbit/records';
import { waitForIt } from '../utils';

interface IProps {
  myPlanId?: string;
  passageId?: string;
  reset?: () => void;
  onMediaIdChange: (mediaId: string) => void;
  onDialogVisible?: (show: boolean) => void;
}

export const useMediaSave = (props: IProps) => {
  const { myPlanId, passageId, onMediaIdChange, onDialogVisible, reset } =
    props;
  const dispatch = useDispatch();
  const uploadFiles = (files: File[]) => dispatch(actions.uploadFiles(files));
  const nextUpload = (props: actions.NextUploadProps) =>
    dispatch(actions.nextUpload(props));
  const uploadComplete = () => {
    onDialogVisible?.(false);
    dispatch(actions.uploadComplete);
  };
  const [plan] = useGlobal('plan'); //will be constant here
  const [memory] = useGlobal('memory');
  const [reporter] = useGlobal('errorReporter');
  const [coordinator] = useGlobal('coordinator');
  const remote = coordinator?.getSource('remote') as JSONAPISource;
  const backup = coordinator?.getSource('backup') as IndexedDBSource;
  const [user] = useGlobal('user');
  const [offlineOnly] = useGlobal('offlineOnly'); //will be constant here
  const fileList = useRef<File[]>();
  const { getTypeId } = useArtifactType();
  const tokenCtx = useContext(TokenContext);
  const { accessToken } = tokenCtx.state;
  const getGlobal = useGetGlobal();
  const mediaIdRef = useRef<string>();
  const { createMedia } = useOfflnMediafileCreate();

  const getPlanId = () => {
    if (myPlanId)
      return (
        remoteIdNum('plan', myPlanId, memory?.keyMap as RecordKeyMap) ||
        myPlanId
      );
    return remoteIdNum('plan', plan, memory?.keyMap as RecordKeyMap) || plan;
  };

  const TitleId = useMemo(() => {
    var id = getTypeId(ArtifactTypeSlug.Title) as string;
    return remoteId('artifacttype', id, memory?.keyMap as RecordKeyMap) || id;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offlineOnly]);

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
      ).then(() => {
        onMediaIdChange(
          remoteIdGuid('mediafile', mediaId, memory?.keyMap as RecordKeyMap) ??
            mediaId
        );
        reset?.();
      });
    } else reset?.();
  };

  const getUserId = () =>
    remoteIdNum('user', user || '', memory?.keyMap as RecordKeyMap) || user;
  const getPassageId = () =>
    remoteIdNum('passage', passageId || '', memory?.keyMap as RecordKeyMap) ||
    passageId;
  const itemComplete = async (n: number, success: boolean, data?: any) => {
    const uploadList = fileList.current;
    if (!uploadList) return; // This should never happen
    if (data?.stringId) {
      mediaIdRef.current = data?.stringId;
    } else if (success && data) {
      // offlineOnly
      var num = 1;
      mediaIdRef.current = (
        await createMedia(
          data,
          num,
          uploadList[n].size,
          passageId ?? '',
          TitleId,
          '',
          user
        )
      ).id;
    }
    if (!getGlobal('offline') && mediaIdRef.current) {
      pullTableList(
        'mediafile',
        Array(mediaIdRef.current),
        memory,
        remote,
        backup,
        reporter
      ).then(() => {
        uploadComplete();
        afterUploadCb(mediaIdRef.current ?? '');
      });
    } else {
      uploadComplete();
      afterUploadCb(mediaIdRef.current ?? '');
    }
  };

  const uploadMedia = async (files: File[]) => {
    uploadFiles(files);
    fileList.current = files;
    const mediaFile = {
      planId: getPlanId(),
      versionNumber: 1,
      originalFile: files[0].name,
      contentType: files[0]?.type,
      artifactTypeId: passageId !== undefined ? VernacularTag : TitleId,
      recordedbyUserId: getUserId(),
      userId: getUserId(),
      passageId: getPassageId(),
    };
    nextUpload({
      record: mediaFile,
      files,
      n: 0,
      token: accessToken || '',
      offline: getGlobal('offline'),
      errorReporter: undefined, //TODO
      uploadType: UploadType.Media,
      cb: itemComplete,
    });
  };

  return { uploadMedia };
};
