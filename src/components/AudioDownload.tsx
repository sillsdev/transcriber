import React, { useState, useEffect } from 'react';
import { useGlobal } from 'reactn';
import { connect } from 'react-redux';
import { IState, MediaFile, IAudioDownloadStrings } from '../model';
import localStrings from '../selector/localize';
import { makeStyles, Theme, createStyles, IconButton } from '@material-ui/core';
import DownloadIcon from '@material-ui/icons/GetAppOutlined';
import { remoteIdGuid, useFetchMediaUrl, MediaSt } from '../crud';
import Auth from '../auth/Auth';
import { loadBlob, removeExtension } from '../utils';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    actionButton: {
      color: theme.palette.primary.light,
    },
    icon: {
      fontSize: '16px',
    },
  })
);

interface IStateProps {
  t: IAudioDownloadStrings;
}

interface IProps extends IStateProps {
  auth: Auth;
  title?: string;
  mediaId: string;
}

export const AudioDownload = (props: IProps) => {
  const { mediaId, title, t } = props;
  const { auth } = props;
  const classes = useStyles();
  const [memory] = useGlobal('memory');
  const [reporter] = useGlobal('errorReporter');
  const { fetchMediaUrl, mediaState } = useFetchMediaUrl(reporter);
  const audAnchor = React.useRef<HTMLAnchorElement>(null);
  const [audName, setAudName] = useState('');
  const [blobUrl, setBlobUrl] = useState('');

  const handleDownload = () => {
    const id = remoteIdGuid('mediafile', mediaId, memory.keyMap) || mediaId;
    const mediaRec = memory.cache.query((q) =>
      q.findRecord({ type: 'mediafile', id })
    ) as MediaFile;
    const fullName = mediaRec?.attributes?.originalFile || `media-${id}`;
    const { name, ext } = removeExtension(fullName);
    const version = mediaRec?.attributes?.versionNumber || '1';
    setAudName(`${name}-ver${version}.${ext}`);
    if (id !== mediaState.urlMediaId) {
      fetchMediaUrl({ id, auth });
    }
  };

  useEffect(() => {
    setBlobUrl('');
    if (mediaState.status === MediaSt.FETCHED)
      loadBlob(mediaState.url, (url, b) => {
        //not sure what this intermediary file is, but causes console errors
        if (b.type !== 'text/html') setBlobUrl(URL.createObjectURL(b));
      });
  }, [mediaState]);

  useEffect(() => {
    if (audName !== '' && blobUrl !== '') {
      if (audAnchor?.current) {
        audAnchor.current.click();
        setAudName('');
        setBlobUrl('');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blobUrl, audName]);

  return (
    <div>
      <IconButton
        id="audDownload"
        className={classes.actionButton}
        title={title || t.downloadMedia}
        disabled={(mediaId || '') === ''}
        onClick={handleDownload}
      >
        <DownloadIcon />
      </IconButton>
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

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'audioDownload' }),
});

export default connect(mapStateToProps)(AudioDownload) as any;
