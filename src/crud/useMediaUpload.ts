import { useRef, useContext } from 'react';
import { useGetGlobal, useGlobal } from '../context/GlobalContext';
import {
  pullTableList,
  related,
  remoteIdNum,
  useArtifactType,
  useOfflnMediafileCreate,
} from '.';
import * as actions from '../store';
import JSONAPISource from '@orbit/jsonapi';
import { TokenContext } from '../context/TokenProvider';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { IndexedDBSource } from '@orbit/indexeddb';
import { UploadType } from '../components/MediaUpload';
import { RecordKeyMap } from '@orbit/records';
import { getContentType } from '../utils/contentType';
import { ISharedStrings, MediaFile } from '../model';
import { sharedSelector } from '../selector';
import { OrbitNetworkErrorRetries } from '../api-variable';

interface IProps {
  artifactId: string | null;
  passageId: string | undefined;
  planId?: string;
  sourceMediaId?: string;
  sourceSegments?: string;
  performedBy?: string;
  topic?: string;
  afterUploadCb: (mediaId: string) => Promise<void>;
}
export const useMediaUpload = ({
  artifactId,
  passageId,
  sourceMediaId,
  sourceSegments,
  performedBy,
  planId,
  topic,
  afterUploadCb,
}: IProps) => {
  const dispatch = useDispatch();
  const uploadFiles = (files: File[]) => dispatch(actions.uploadFiles(files));
  const nextUpload = (props: actions.NextUploadProps) =>
    dispatch(actions.nextUpload(props));
  const uploadComplete = () => dispatch(actions.uploadComplete);
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
  const ts: ISharedStrings = useSelector(sharedSelector, shallowEqual);
  const { localizedArtifactTypeFromId } = useArtifactType();
  const [, setOrbitRetries] = useGlobal('orbitRetries'); //verified this is not used in a function 2/18/25
  const getLatestVersion = () => {
    var num = 1;
    var psgId = passageId || '';
    if (psgId && !artifactId) {
      const mediaFiles = (
        memory.cache.query((q) => q.findRecords('mediafile')) as MediaFile[]
      )
        .filter(
          (m) =>
            related(m, 'passage') === psgId &&
            related(m, 'artifactType') === null
        )
        .filter((m) => m?.attributes?.versionNumber !== undefined)
        .sort(
          (i, j) => j.attributes.versionNumber - i.attributes.versionNumber
        );
      if (mediaFiles.length > 0) {
        //vernacular
        num = mediaFiles[0].attributes.versionNumber + 1;
      }
    }
    return num;
  };
  const itemComplete = async (n: number, success: boolean, data?: any) => {
    if (!success) setOrbitRetries(OrbitNetworkErrorRetries - 1); //notify of possible network issue
    const uploadList = fileList.current;
    if (!uploadList) return; // This should never happen
    if (data?.stringId) {
      mediaIdRef.current = data?.stringId;
    } else if (success && data) {
      // offlineOnly
      var num = getLatestVersion();
      mediaIdRef.current = (
        await createMedia(
          data,
          num,
          uploadList[n].size,
          passageId ?? '',
          artifactId,
          '',
          user
        )
      ).id;
    } else mediaIdRef.current = '';
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
      planId
        ? remoteIdNum('plan', planId, memory?.keyMap as RecordKeyMap) || planId
        : remoteIdNum(
            'plan',
            getGlobal('plan'),
            memory?.keyMap as RecordKeyMap
          ) || getGlobal('plan');
    const getArtifactId = () =>
      artifactId === null
        ? null
        : remoteIdNum(
            'artifacttype',
            artifactId,
            memory?.keyMap as RecordKeyMap
          ) || artifactId;
    const getPassageId = () =>
      passageId
        ? remoteIdNum('passage', passageId, memory?.keyMap as RecordKeyMap) ||
          passageId
        : '';
    const getUserId = () =>
      remoteIdNum('user', user, memory?.keyMap as RecordKeyMap) || user;
    const getSourceMediaId = () =>
      remoteIdNum(
        'mediafile',
        sourceMediaId || '',
        memory?.keyMap as RecordKeyMap
      ) || sourceMediaId;

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
      sourceMediaId: getSourceMediaId(),
      sourceSegments: sourceSegments,
      performedBy: performedBy,
      topic: topic,
      eafUrl: !artifactId
        ? ts.mediaAttached
        : localizedArtifactTypeFromId(artifactId), //put psc message here
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
