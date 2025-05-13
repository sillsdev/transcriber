import { useEffect, useMemo, useState } from 'react';
import { useGlobal } from '../../context/GlobalContext';
import { findRecord, related, useArtifactType } from '../../crud';
import { ISharedStrings, MediaFile } from '../../model';
import { useMediaUpload } from '../../crud';

import { cleanFileName } from '../../utils';
import { useSelector, shallowEqual } from 'react-redux';
import { useSnackBar } from '../../hoc/SnackBar';
import { sharedSelector } from '../../selector';

interface IProps {
  mediafileId: string;
  commentNumber: number;
  afterUploadCb: (mediaId: string) => Promise<void>;
}

export const useRecordComment = ({
  mediafileId,
  commentNumber,
  afterUploadCb,
}: IProps) => {
  const [memory] = useGlobal('memory');
  const { commentId } = useArtifactType();
  const passageId = useMemo(() => {
    const vernRec = findRecord(memory, 'mediafile', mediafileId) as MediaFile;
    return related(vernRec, 'passage') as string;
  }, [mediafileId, memory]);
  const ts: ISharedStrings = useSelector(sharedSelector, shallowEqual);
  const { showMessage } = useSnackBar();
  const [uploadSuccess, setUploadSuccess] = useState<boolean | undefined>();

  const fileName = (subject: string, id: string) => {
    return `${cleanFileName(subject)}${(id + 'xxxx').slice(
      0,
      4
    )}-${commentNumber}`;
  };
  const uploadMedia = useMediaUpload({
    artifactId: commentId,
    passageId,
    afterUploadCb,
    setUploadSuccess,
  });

  useEffect(() => {
    if (uploadSuccess === false)
      //ignore undefined
      showMessage(ts.NoSaveOffline);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadSuccess]);

  return { uploadMedia, fileName, uploadSuccess };
};
