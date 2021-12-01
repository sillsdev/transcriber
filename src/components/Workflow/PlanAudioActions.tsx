import React from 'react';
import { useGlobal } from 'reactn';
import {
  ISharedStrings,
  IPlanActionsStrings,
  IState,
  IMediaShare,
} from '../../model';
import { makeStyles, Theme, createStyles, IconButton } from '@material-ui/core';
//import AddIcon from '@material-ui/icons/AddCircleOutline';
import AddIcon from '@material-ui/icons/LibraryAddOutlined';
import PlayIcon from '@material-ui/icons/PlayArrowOutlined';
import StopIcon from '@material-ui/icons/Stop';
import MicIcon from '@material-ui/icons/Mic';
import SharedCheckbox from '@material-ui/icons/CheckBoxOutlined';
import NotSharedCheckbox from '@material-ui/icons/CheckBoxOutlineBlankOutlined';
import VersionsIcon from '@material-ui/icons/List';

import localStrings from '../../selector/localize';
import { connect } from 'react-redux';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    arrangeActions: {
      display: 'flex',
      justifyContent: 'space-between',
    },
    actionButton: {
      color: theme.palette.primary.light,
    },
    oldShared: {
      color: theme.palette.secondary.light,
    },
  })
);
interface IStateProps {
  t: IPlanActionsStrings;
  ts: ISharedStrings;
}
interface IProps extends IStateProps {
  rowIndex: number;
  isSection: boolean;
  isPassage: boolean;
  mediaId: string;
  mediaShared: IMediaShare;
  online: boolean;
  readonly: boolean;
  isPlaying: boolean;
  canAssign: boolean;
  canDelete: boolean;
  onTranscribe: (i: number) => () => void;
  onAssign: (where: number[]) => () => void;
  onUpload: (i: number) => () => void;
  onRecord: (i: number) => () => void;
  onPlayStatus: (mediaId: string) => void;
  onDelete: (i: number) => () => void;
  onHistory: (i: number) => () => void;
}

export function PlanAudioActions(props: IProps) {
  const {
    t,
    ts,
    rowIndex,
    isPassage,
    mediaId,
    mediaShared,
    online,
    readonly,
    onUpload,
    onRecord,
    onPlayStatus,
    onHistory,
    isPlaying,
  } = props;
  const classes = useStyles();
  const [offlineOnly] = useGlobal('offlineOnly');

  const handlePlayStatus = () => () => {
    onPlayStatus(isPlaying ? '' : mediaId);
  };
  const handleRecord = (index: number) => () => {
    onPlayStatus('');
    onRecord(index);
  };

  return (
    <div className={classes.arrangeActions}>
      {isPassage && (
        <IconButton
          id="passageShare"
          className={
            mediaShared === IMediaShare.OldVersionOnly
              ? classes.oldShared
              : classes.actionButton
          }
          title={t.versions}
          disabled={(mediaId || '') === ''}
          onClick={onHistory(rowIndex)}
        >
          {mediaShared === IMediaShare.NotPublic ? (
            <VersionsIcon />
          ) : mediaShared === IMediaShare.None ? (
            <NotSharedCheckbox />
          ) : (
            <SharedCheckbox />
          )}
        </IconButton>
      )}
      {isPassage &&
        !readonly &&
        online && ( //online here is really connected or offlineOnly
          <IconButton
            id="planAudUpload"
            className={classes.actionButton}
            onClick={onUpload(rowIndex)}
            title={
              !offlineOnly ? ts.uploadMediaSingular : ts.importMediaSingular
            }
          >
            <AddIcon />
          </IconButton>
        )}
      {isPassage && !readonly && (
        <IconButton
          id="planAudRec"
          className={classes.actionButton}
          onClick={handleRecord(rowIndex)}
          title={t.recordAudio}
        >
          <MicIcon />
        </IconButton>
      )}
      {isPassage && (
        <IconButton
          id="planAudPlayStop"
          className={classes.actionButton}
          title={t.playpause}
          disabled={(mediaId || '') === ''}
          onClick={handlePlayStatus()}
        >
          {isPlaying ? <StopIcon /> : <PlayIcon />}
        </IconButton>
      )}
    </div>
  );
}
const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'planActions' }),
  ts: localStrings(state, { layout: 'shared' }),
});
export default connect(mapStateToProps)(PlanAudioActions) as any as any;
