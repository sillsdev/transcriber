import { useRef, useContext } from 'react';
import { useGlobal } from 'reactn';
import { pullTableList, remoteIdNum, useOfflnMediafileCreate } from '.';
import * as actions from '../store';
import JSONAPISource from '@orbit/jsonapi';
import { TokenContext } from '../context/TokenProvider';
import { useDispatch } from 'react-redux';
import { PassageDetailContext } from '../context/PassageDetailContext';
import IndexedDBSource from '@orbit/indexeddb/dist/types/source';
import { UploadType } from '../components/MediaUpload';

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
  const remote = coordinator.getSource('remote') as JSONAPISource;
  const backup = coordinator.getSource('backup') as IndexedDBSource;
  const [plan] = useGlobal('plan');
  const [user] = useGlobal('user');
  const [offline] = useGlobal('offline');
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
    if (!offline) {
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
    const getPlanId = () => remoteIdNum('plan', plan, memory.keyMap) || plan;
    const getArtifactId = () =>
      remoteIdNum('artifacttype', artifactId, memory.keyMap) || artifactId;
    const getPassageId = () =>
      remoteIdNum('passage', passage.id, memory.keyMap) || passage.id;
    const getUserId = () => remoteIdNum('user', user, memory.keyMap) || user;

    uploadFiles(files);
    fileList.current = files;
    const mediaFile = {
      planId: getPlanId(),
      versionNumber: 1,
      originalFile: files[0].name,
      contentType: files[0].type,
      artifactTypeId: getArtifactId(),
      passageId: getPassageId(),
      recordedByUserId: getUserId(),
      userId: getUserId(),
    };
    nextUpload({
      record: mediaFile,
      files,
      n: 0,
      token: accessToken || '',
      offline: offline,
      errorReporter: reporter,
      uploadType: UploadType.Media,
      cb: itemComplete,
    });
  };
};
