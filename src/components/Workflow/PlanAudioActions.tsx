import React from 'react';
import { IPlanActionsStrings, IState, IMediaShare } from '../../model';
import { makeStyles, Theme, createStyles, IconButton } from '@material-ui/core';
//import AddIcon from '@material-ui/icons/AddCircleOutline';
import PlayIcon from '@material-ui/icons/PlayArrowOutlined';
import PauseIcon from '@material-ui/icons/Pause';
import TranscribeIcon from '../../control/TranscribeIcon';
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
  onTranscribe: (i: number) => void;
  onAssign: (where: number[]) => () => void;
  onPlayStatus: (mediaId: string) => void;
  onDelete: (i: number) => () => void;
  onHistory: (i: number) => () => void;
}

export function PlanAudioActions(props: IProps) {
  const {
    t,
    rowIndex,
    isPassage,
    mediaId,
    mediaShared,
    onPlayStatus,
    onHistory,
    onTranscribe,
    isPlaying,
  } = props;
  const classes = useStyles();

  const handlePlayStatus = () => () => {
    onPlayStatus(mediaId);
  };

  const handleTranscribe = (i: number) => () => {
    onPlayStatus('');
    onTranscribe(i);
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
      {isPassage && (
        <IconButton
          id="planAudPlayStop"
          className={classes.actionButton}
          title={t.playpause}
          disabled={(mediaId || '') === ''}
          onClick={handlePlayStatus()}
        >
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </IconButton>
      )}
      {isPassage && (
        <IconButton
          id="planActTrans"
          title={t.transcribe}
          onClick={handleTranscribe(rowIndex)}
          disabled={(mediaId || '') === ''}
        >
          <TranscribeIcon />
        </IconButton>
      )}
    </div>
  );
}
const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'planActions' }),
});
export default connect(mapStateToProps)(PlanAudioActions) as any as any;
