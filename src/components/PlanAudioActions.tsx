import React from 'react';
import { useGlobal } from 'reactn';
import { ISharedStrings, IPlanActionsStrings, IState } from '../model';
import { makeStyles, Theme, createStyles, IconButton } from '@material-ui/core';
//import AddIcon from '@material-ui/icons/AddCircleOutline';
import AddIcon from '@material-ui/icons/LibraryAddOutlined';
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
  passageId: RecordIdentity;
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

export function PlanAudioActions(props: IProps) {
  const {
    t,
    ts,
    rowIndex,
    isPassage,
    passageId,
    mediaId,
    online,
    readonly,
    onUpload,
    onRecord,
    onPlayStatus,
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
