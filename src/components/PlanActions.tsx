import { ISharedStrings, IPlanActionsStrings, IState } from '../model';
import { makeStyles, Theme, createStyles, IconButton } from '@material-ui/core';
import React from 'react';
import AssignIcon from '@material-ui/icons/PeopleAltOutlined';
import DeleteIcon from '@material-ui/icons/DeleteOutline';
import TranscribeIcon from '@material-ui/icons/EditOutlined';
import UploadIcon from '@material-ui/icons/CloudUploadOutlined';
import PlayIcon from '@material-ui/icons/PlayArrowOutlined';
import StopIcon from '@material-ui/icons/Stop';
import localStrings from '../selector/localize';
import { connect } from 'react-redux';
import { isElectron } from '../api-variable';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    arrangeActions: {
      display: 'flex',
      justifyContent: 'space-between',
    },
    actionButton: {
      color: theme.palette.primary.light,
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
  online: boolean;
  readonly: boolean;
  isPlaying: boolean;
  canAssign: boolean;
  canDelete: boolean;
  onTranscribe: (i: number) => () => void;
  onAssign: (where: number[]) => () => void;
  onUpload: (i: number) => () => void;
  onPlayStatus: (mediaId: string) => void;
  onDelete: (i: number) => () => void;
}

export function PlanActions(props: IProps) {
  const {
    t,
    ts,
    rowIndex,
    isSection,
    isPassage,
    mediaId,
    online,
    readonly,
    onTranscribe,
    onAssign,
    onUpload,
    onPlayStatus,
    onDelete,
    isPlaying,
    canAssign,
    canDelete,
  } = props;
  const classes = useStyles();

  const handlePlayStatus = () => () => {
    onPlayStatus(isPlaying ? '' : mediaId);
  };

  return (
    <div className={classes.arrangeActions}>
      {isSection && canAssign && !readonly && (
        <IconButton
          className={classes.actionButton}
          title={t.assign}
          onClick={onAssign([rowIndex])}
        >
          <AssignIcon />
        </IconButton>
      )}
      {isPassage &&
        !readonly &&
        online && ( //for now just online
          <IconButton
            className={classes.actionButton}
            onClick={onUpload(rowIndex)}
            title={ts.uploadMediaSingular}
          >
            <UploadIcon />
          </IconButton>
        )}
      {isPassage && (isElectron || online) && (
        <IconButton
          className={classes.actionButton}
          title={t.playpause}
          disabled={(mediaId || '') === ''}
          onClick={handlePlayStatus()}
        >
          {isPlaying ? <StopIcon /> : <PlayIcon />}
        </IconButton>
      )}
      {isPassage && (
        <IconButton
          className={classes.actionButton}
          title={t.transcribe}
          onClick={onTranscribe(rowIndex)}
          disabled={(mediaId || '') === ''}
        >
          <TranscribeIcon />
        </IconButton>
      )}
      {canDelete && !readonly && (
        <IconButton
          className={classes.actionButton}
          title={t.delete}
          onClick={onDelete(rowIndex)}
        >
          <DeleteIcon />
        </IconButton>
      )}
    </div>
  );
}
const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'planActions' }),
  ts: localStrings(state, { layout: 'shared' }),
});
export default (connect(mapStateToProps)(PlanActions) as any) as any;
