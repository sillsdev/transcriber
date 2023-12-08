import React, { useState, useEffect } from 'react';
import { useGlobal } from 'reactn';
import { MediaFile, IAudioDownloadStrings, ISharedStrings } from '../model';
import { IconButton, IconButtonProps, styled } from '@mui/material';
import DownloadIcon from '@mui/icons-material/GetAppOutlined';
import {
  remoteIdGuid,
  useFetchMediaUrl,
  MediaSt,
  mediaFileName,
} from '../crud';
import { loadBlob, removeExtension } from '../utils';
import { useSnackBar } from '../hoc/SnackBar';
import { useSelector } from 'react-redux';
import { audioDownloadSelector, sharedSelector } from '../selector';
import { RecordKeyMap } from '@orbit/records';

const StyledIcon = styled(IconButton)<IconButtonProps>(({ theme }) => ({
  color: theme.palette.primary.light,
}));

interface IProps {
  title?: string;
  mediaId: string;
}

export const AudioDownload = (props: IProps) => {
  const { mediaId, title } = props;
  const t: IAudioDownloadStrings = useSelector(audioDownloadSelector);
  const ts: ISharedStrings = useSelector(sharedSelector);
  const [memory] = useGlobal('memory');
  const [reporter] = useGlobal('errorReporter');
  const { fetchMediaUrl, mediaState } = useFetchMediaUrl(reporter);
  const audAnchor = React.useRef<HTMLAnchorElement>(null);
  const [audName, setAudName] = useState('');
  const [blobUrl, setBlobUrl] = useState('');
  const { showMessage } = useSnackBar();

  const handleDownload = () => {
    const id =
      remoteIdGuid('mediafile', mediaId, memory.keyMap as RecordKeyMap) ||
      mediaId;
    const mediaRec = memory.cache.query((q) =>
      q.findRecord({ type: 'mediafile', id })
    ) as MediaFile;
    const fullName = mediaFileName(mediaRec) || `media-${id}`;
    const { name, ext } = removeExtension(fullName);
    const version = mediaRec?.attributes?.versionNumber || '1';
    setAudName(`${name}-ver${version}.${ext}`);
    if (id !== mediaState.id) {
      fetchMediaUrl({ id });
    }
  };

  useEffect(() => {
    setBlobUrl('');
    if (mediaState.status === MediaSt.FETCHED)
      loadBlob(mediaState.url, (url, b) => {
        //not sure what this intermediary file is, but causes console errors
        if (b && b.type !== 'text/html') setBlobUrl(URL.createObjectURL(b));
      });
    if (mediaState?.error?.startsWith('no offline file'))
      showMessage(ts.fileNotFound);
    else if (mediaState?.error) showMessage(mediaState.error);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaState]);

  useEffect(() => {
    if (audName !== '' && blobUrl !== '') {
      if (audAnchor?.current) {
        audAnchor.current.click();
        setAudName('');
        setBlobUrl('');
      }
      fetchMediaUrl({ id: '' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blobUrl, audName]);

  return (
    <div>
      <StyledIcon
        id="audDownload"
        title={title || t.downloadMedia}
        disabled={
          (mediaId || '') === '' ||
          mediaId === mediaState.remoteId ||
          audName !== ''
        }
        onClick={handleDownload}
      >
        <DownloadIcon />
      </StyledIcon>
      {blobUrl && (
        /* eslint-disable-next-line jsx-a11y/anchor-has-content */
        <a
          ref={audAnchor}
          href={blobUrl}
          download={audName}
          target="_blank"
          rel="noopener noreferrer"
        />
      )}
    </div>
  );
};

export default AudioDownload;
