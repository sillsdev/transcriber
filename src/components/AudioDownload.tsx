import React, { useState, useEffect } from 'react';
import { useGlobal } from 'reactn';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import * as actions from '../store';
import { IState, MediaFile } from '../model';
import { makeStyles, Theme, createStyles, IconButton } from '@material-ui/core';
import DownloadIcon from '@material-ui/icons/GetAppOutlined';
import { getMediaName, remoteIdGuid } from '../crud';
import { logError, Severity } from '../utils';
import Auth from '../auth/Auth';

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
  hasUrl: boolean;
  mediaUrl: string;
}

interface IDispatchProps {
  fetchMediaUrl: typeof actions.fetchMediaUrl;
}

interface IProps extends IStateProps, IDispatchProps {
  auth: Auth;
  title: string;
  mediaId: string;
}

export const AudioDownload = (props: IProps) => {
  const { mediaId, title } = props;
  const { hasUrl, mediaUrl, auth, fetchMediaUrl } = props;
  const classes = useStyles();
  const [memory] = useGlobal('memory');
  const [offline] = useGlobal('offline');
  const [globalStore] = useGlobal();
  const audAnchor = React.useRef<HTMLAnchorElement>(null);
  const [audUrl, setAudUrl] = useState<string | undefined>();
  const [audName, setAudName] = useState('');

  const handleDownload = () => {
    logError(Severity.info, globalStore.errorReporter, `handleDownload`);
    const id = remoteIdGuid('mediafile', mediaId, memory.keyMap) || mediaId;
    const mediaRec = memory.cache.query((q) =>
      q.findRecord({ type: 'mediafile', id })
    ) as MediaFile;
    logError(Severity.info, globalStore.errorReporter, `Media Id=${mediaId}`);
    if (id) fetchMediaUrl(id, memory, offline, auth, globalStore.errorReporter);
    const name = mediaRec?.attributes?.originalFile || `media-${id}`;
    setAudName(name);
  };

  useEffect(() => {
    if (audUrl && audName !== '') {
      if (audAnchor?.current) {
        logError(
          Severity.info,
          globalStore.errorReporter,
          `audName=${audName}, audUrl=${audUrl}, audAnchor=${audAnchor?.current}`
        );
        audAnchor.current.click();
        setAudUrl(undefined);
        setAudName('');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audUrl, audName]);

  useEffect(() => {
    if (audName !== '' && !audUrl && mediaUrl && mediaUrl !== '') {
      logError(
        Severity.info,
        globalStore.errorReporter,
        `audName=${audName}, audUrl=${audUrl} mediaUrl=${mediaUrl}`
      );
      setAudUrl(mediaUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasUrl, mediaUrl, audName]);

  return (
    <div>
      <IconButton
        className={classes.actionButton}
        title={title}
        disabled={(mediaId || '') === ''}
        onClick={handleDownload}
      >
        <DownloadIcon />
      </IconButton>
      {/* eslint-disable-next-line jsx-a11y/anchor-has-content */}
      <a
        ref={audAnchor}
        href={audUrl}
        download={audName}
        target="_blank"
        rel="noopener noreferrer"
      />
    </div>
  );
};

const mapStateToProps = (state: IState): IStateProps => ({
  hasUrl: state.media.loaded,
  mediaUrl: state.media.url,
});

const mapDispatchToProps = (dispatch: any): IDispatchProps => ({
  ...bindActionCreators(
    {
      fetchMediaUrl: actions.fetchMediaUrl,
    },
    dispatch
  ),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(AudioDownload) as any;
