import React from 'react';
import { useGlobal } from 'reactn';
import { ISharedStrings, IPlanActionsStrings, IState } from '../model';
import { makeStyles, Theme, createStyles, IconButton } from '@material-ui/core';
import AssignIcon from '@material-ui/icons/PeopleAltOutlined';
import DeleteIcon from '@material-ui/icons/DeleteOutline';
import TranscribeIcon from '@material-ui/icons/EditOutlined';
import AddIcon from '@material-ui/icons/AddCircleOutline';
import PlayIcon from '@material-ui/icons/PlayArrowOutlined';
import StopIcon from '@material-ui/icons/Stop';
import MicIcon from '@material-ui/icons/Mic';
import localStrings from '../selector/localize';
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
  onRecord: (i: number) => () => void;
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
    onRecord,
    onPlayStatus,
    onDelete,
    isPlaying,
    canAssign,
    canDelete,
  } = props;
  const classes = useStyles();
  const [offlineOnly] = useGlobal('offlineOnly');

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
        online && ( //online here is really connected or offlineOnly
          <IconButton
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
          className={classes.actionButton}
          onClick={onRecord(rowIndex)}
          title={'Record Audio'}
        >
          <MicIcon />
        </IconButton>
      )}
      {isPassage && (
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
