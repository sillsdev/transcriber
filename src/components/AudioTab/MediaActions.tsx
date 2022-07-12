import React from 'react';
import { IMediaActionsStrings, IState } from '../../model';
import { makeStyles, Theme, createStyles, IconButton } from '@material-ui/core';
import PlayIcon from '@mui/icons-material/PlayArrowOutlined';
import { FaPaperclip, FaUnlink } from 'react-icons/fa';
import PauseIcon from '@mui/icons-material/Pause';
import localStrings from '../../selector/localize';
import { connect } from 'react-redux';
import { isElectron } from '../../api-variable';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    arrangeActions: {
      display: 'flex',
      justifyContent: 'space-between',
    },
    actionButton: {
      color: theme.palette.primary.light,
    },
    icon: {
      fontSize: '16px',
    },
  })
);
interface IStateProps {
  t: IMediaActionsStrings;
}
interface IProps extends IStateProps {
  rowIndex: number;
  mediaId: string;
  online: boolean;
  readonly: boolean;
  isPlaying: boolean;
  attached: boolean;
  onAttach: (where: number[], attach: boolean) => () => void;
  onPlayStatus: (mediaId: string) => void;
}

export function MediaActions(props: IProps) {
  const {
    t,
    rowIndex,
    mediaId,
    online,
    readonly,
    onAttach,
    onPlayStatus,
    isPlaying,
    attached,
  } = props;
  const classes = useStyles();

  const handlePlayStatus = () => {
    onPlayStatus(mediaId);
  };

  const handleAttach = () => {
    onAttach([rowIndex], !attached);
  };

  return (
    <div className={classes.arrangeActions}>
      {!readonly && (
        <IconButton
          id="audActAttach"
          className={classes.actionButton}
          title={!attached ? t.attach : t.detach}
          onClick={handleAttach}
        >
          {!attached ? (
            <FaPaperclip className={classes.icon} />
          ) : (
            <FaUnlink className={classes.icon} />
          )}
        </IconButton>
      )}
      {(isElectron || online) && (
        <IconButton
          id="audActPlayStop"
          className={classes.actionButton}
          title={isPlaying ? t.pause : t.play}
          disabled={(mediaId || '') === ''}
          onClick={handlePlayStatus}
        >
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </IconButton>
      )}
    </div>
  );
}
const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'mediaActions' }),
});
export default connect(mapStateToProps)(MediaActions) as any as any;
