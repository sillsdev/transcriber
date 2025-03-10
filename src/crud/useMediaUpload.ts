import { useRef, useContext } from 'react';
import { useGetGlobal, useGlobal } from '../context/GlobalContext';
import { pullTableList, remoteIdNum, useOfflnMediafileCreate } from '.';
import * as actions from '../store';
import JSONAPISource from '@orbit/jsonapi';
import { TokenContext } from '../context/TokenProvider';
import { useDispatch } from 'react-redux';
import { PassageDetailContext } from '../context/PassageDetailContext';
import { IndexedDBSource } from '@orbit/indexeddb';
import { UploadType } from '../components/MediaUpload';
import { RecordKeyMap } from '@orbit/records';
import { getContentType } from '../utils/contentType';

interface IProps {
  artifactId: string;
  afterUploadCb: (mediaId: string) => Promise<void>;
}
export const useMediaUpload = ({ artifactId, afterUploadCb }: IProps) => {
  const dispatch = useDispatch();
  const uploadFiles = (files: File[]) => dispatch(actions.uploadFiles(files));
  const nextUpload = (props: actions.NextUploadProps) =>
    dispatch(actions.nextUpload(props));
  const uploadComplete = () => dispatch(actions.uploadComplete);
  const { passage } = useContext(PassageDetailContext).state;
  const [reporter] = useGlobal('errorReporter');
  const [memory] = useGlobal('memory');
  const [coordinator] = useGlobal('coordinator');
  const remote = coordinator?.getSource('remote') as JSONAPISource;
  const backup = coordinator?.getSource('backup') as IndexedDBSource;
  const getGlobal = useGetGlobal();
  const [user] = useGlobal('user');
  const { accessToken } = useContext(TokenContext).state;
  const fileList = useRef<File[]>();
  const mediaIdRef = useRef('');
  const { createMedia } = useOfflnMediafileCreate();

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
          passage.id,
          artifactId,
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
        afterUploadCb(mediaIdRef.current);
      });
    } else {
      uploadComplete();
      afterUploadCb(mediaIdRef.current);
    }
  };

  return async (files: File[]) => {
    const getPlanId = () =>
      remoteIdNum('plan', getGlobal('plan'), memory?.keyMap as RecordKeyMap) ||
      getGlobal('plan');
    const getArtifactId = () =>
      remoteIdNum('artifacttype', artifactId, memory?.keyMap as RecordKeyMap) ||
      artifactId;
    const getPassageId = () =>
      remoteIdNum('passage', passage.id, memory?.keyMap as RecordKeyMap) ||
      passage.id;
    const getUserId = () =>
      remoteIdNum('user', user, memory?.keyMap as RecordKeyMap) || user;

    uploadFiles(files);
    fileList.current = files;
    const mediaFile = {
      planId: getPlanId(),
      versionNumber: 1,
      originalFile: files[0].name,
      contentType: getContentType(files[0]?.type, files[0].name),
      artifactTypeId: getArtifactId(),
      passageId: getPassageId(),
      recordedbyUserId: getUserId(),
      userId: getUserId(),
    };
    nextUpload({
      record: mediaFile,
      files,
      n: 0,
      token: accessToken || '',
      offline: getGlobal('offline'),
      errorReporter: reporter,
      uploadType: UploadType.Media,
      cb: itemComplete,
    });
  };
};
