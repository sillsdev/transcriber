import { ISharedStrings, IPlanActionsStrings, IState } from '../model';
import { makeStyles, Theme, createStyles, IconButton } from '@material-ui/core';
import React, { useState } from 'react';
import AssignIcon from '@material-ui/icons/PeopleAltOutlined';
import DeleteIcon from '@material-ui/icons/DeleteOutline';
import TranscribeIcon from '@material-ui/icons/EditOutlined';
import UploadIcon from '@material-ui/icons/CloudUploadOutlined';
import PlayIcon from '@material-ui/icons/PlayArrowOutlined';
import PauseIcon from '@material-ui/icons/Pause';
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
    onTranscribe,
    onAssign,
    onUpload,
    onPlayStatus,
    onDelete,
  } = props;
  const classes = useStyles();
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlayStatus = () => () => {
    onPlayStatus(isPlaying ? '' : mediaId);
    setIsPlaying(!isPlaying);
  };

  return (
    <div className={classes.arrangeActions}>
      {isSection && (
        <IconButton
          className={classes.actionButton}
          title={t.assign}
          onClick={onAssign([rowIndex])}
        >
          <AssignIcon />
        </IconButton>
      )}
      {isPassage && (
        <>
          <IconButton
            className={classes.actionButton}
            onClick={onUpload(rowIndex)}
            title={ts.uploadMediaSingular}
          >
            <UploadIcon />
          </IconButton>
          <IconButton
            className={classes.actionButton}
            title={t.playpause}
            disabled={mediaId === ''}
            onClick={handlePlayStatus()}
          >
            {isPlaying ? <PauseIcon /> : <PlayIcon />}
          </IconButton>
        </>
      )}
      {isPassage && (
        <IconButton
          className={classes.actionButton}
          title={t.transcribe}
          onClick={onTranscribe(rowIndex)}
          disabled={mediaId === ''}
        >
          <TranscribeIcon />
        </IconButton>
      )}
      <IconButton
        className={classes.actionButton}
        title={t.delete}
        onClick={onDelete(rowIndex)}
      >
        <DeleteIcon />
      </IconButton>
    </div>
  );
}
const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'planActions' }),
  ts: localStrings(state, { layout: 'shared' }),
});
export default (connect(mapStateToProps)(PlanActions) as any) as any;
