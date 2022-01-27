import { useMemo, useRef } from 'react';
import { useGlobal } from 'reactn';
import {
  findRecord,
  pullPlanMedia,
  related,
  remoteIdNum,
  useArtifactType,
  useOfflnMediafileCreate,
} from '../../crud';
import { Discussion, MediaFile } from '../../model';
import * as actions from '../../store';
import { cleanFileName } from '../../utils';
import JSONAPISource from '@orbit/jsonapi';
import Auth from '../../auth/Auth';
interface IDispatchProps {
  uploadFiles: typeof actions.uploadFiles;
  nextUpload: typeof actions.nextUpload;
  uploadComplete: typeof actions.uploadComplete;
  doOrbitError: typeof actions.doOrbitError;
}

interface IProps extends IDispatchProps {
  auth: Auth;
  discussion: Discussion;
  number: number;
  afterUploadcb: (mediaId: string) => void;
}

export const useRecordComment = ({
  auth,
  discussion,
  number,
  afterUploadcb,
  uploadFiles,
  nextUpload,
  uploadComplete,
  doOrbitError,
}: IProps) => {
  const [reporter] = useGlobal('errorReporter');
  const [memory] = useGlobal('memory');
  const [coordinator] = useGlobal('coordinator');
  const remote = coordinator.getSource('remote') as JSONAPISource;
  const [plan] = useGlobal('plan');
  const [offline] = useGlobal('offline');
  const { commentId } = useArtifactType();
  const fileList = useRef<File[]>();
  const mediaIdRef = useRef('');
  const { createMedia } = useOfflnMediafileCreate(doOrbitError);

  const passageId = useMemo(() => {
    const vernMediaId = related(discussion, 'mediafile');
    const vernRec = findRecord(memory, 'mediafile', vernMediaId) as MediaFile;
    return related(vernRec, 'passage') as string;
  }, [discussion, memory]);

  const fileName = useMemo(() => {
    return `${cleanFileName(discussion.attributes?.subject)}${(
      discussion.id + 'xxxx'
    ).slice(0, 4)}-${number}`;
  }, [discussion, number]);

  const itemComplete = async (n: number, success: boolean, data?: any) => {
    const uploadList = fileList.current;
    if (!uploadList) return; // This should never happen
    if (data?.stringId) {
      mediaIdRef.current = data?.stringId;
    } else if (success && data) {
      // offlineOnly
      var num = 1;
      mediaIdRef.current = (
        await createMedia(data, num, uploadList[n].size, passageId, commentId)
      ).id;
    }
    if (!offline) {
      pullPlanMedia(plan, memory, remote).then(() => {
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

    uploadFiles(files);
    fileList.current = files;
    const mediaFile = {
      planId: getPlanId(),
      versionNumber: 1,
      originalFile: files[0].name,
      contentType: files[0].type,
      artifactTypeId: getArtifactId(),
      passageId: getPassageId(),
    } as any;
    nextUpload(mediaFile, files, 0, auth, offline, reporter, itemComplete);
  };
  return { uploadMedia, fileName };
};
