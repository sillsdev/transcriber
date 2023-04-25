import { useMemo, useRef, useContext } from 'react';
import { useGlobal } from 'reactn';
import {
  findRecord,
  pullTableList,
  related,
  remoteIdNum,
  useArtifactType,
  useOfflnMediafileCreate,
} from '../../crud';
import { MediaFile } from '../../model';
import * as actions from '../../store';
import { cleanFileName } from '../../utils';
import JSONAPISource from '@orbit/jsonapi';
import { TokenContext } from '../../context/TokenProvider';
import { useDispatch } from 'react-redux';
import IndexedDBSource from '@orbit/indexeddb/dist/types/source';
import { UploadType } from '../MediaUpload';

interface IProps {
  mediafileId: string;
  commentNumber: number;
  afterUploadcb: (mediaId: string) => Promise<void>;
}

export const useRecordComment = ({
  mediafileId,
  commentNumber,
  afterUploadcb,
}: IProps) => {
  const dispatch = useDispatch();
  const uploadFiles = (files: File[]) => dispatch(actions.uploadFiles(files));
  const nextUpload = (props: actions.NextUploadProps) =>
    dispatch(actions.nextUpload(props));
  const uploadComplete = () => dispatch(actions.uploadComplete);
  const [reporter] = useGlobal('errorReporter');
  const [memory] = useGlobal('memory');
  const [coordinator] = useGlobal('coordinator');
  const remote = coordinator.getSource('remote') as JSONAPISource;
  const backup = coordinator.getSource('backup') as IndexedDBSource;
  const [plan] = useGlobal('plan');
  const [user] = useGlobal('user');
  const [offline] = useGlobal('offline');
  const { accessToken } = useContext(TokenContext).state;
  const { commentId } = useArtifactType();
  const fileList = useRef<File[]>();
  const mediaIdRef = useRef('');
  const { createMedia } = useOfflnMediafileCreate();

  const passageId = useMemo(() => {
    const vernRec = findRecord(memory, 'mediafile', mediafileId) as MediaFile;
    return related(vernRec, 'passage') as string;
  }, [mediafileId, memory]);

  const fileName = (subject: string, id: string) => {
    return `${cleanFileName(subject)}${(id + 'xxxx').slice(
      0,
      4
    )}-${commentNumber}`;
  };

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
          passageId,
          commentId,
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
        afterUploadcb(mediaIdRef.current);
      });
    } else {
      uploadComplete();
      afterUploadcb(mediaIdRef.current);
    }
  };

  const uploadMedia = async (files: File[]) => {
    const getPlanId = () => remoteIdNum('plan', plan, memory.keyMap) || plan;
    const getArtifactId = () =>
      remoteIdNum('artifacttype', commentId, memory.keyMap) || commentId;
    const getPassageId = () =>
      remoteIdNum('passage', passageId, memory.keyMap) || passageId;
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
    } as any;
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
  return { uploadMedia, fileName };
};
