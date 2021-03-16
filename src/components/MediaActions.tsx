import React from 'react';
import { IMediaActionsStrings, IState } from '../model';
import { makeStyles, Theme, createStyles, IconButton } from '@material-ui/core';
import DeleteIcon from '@material-ui/icons/DeleteOutline';
import PlayIcon from '@material-ui/icons/PlayArrowOutlined';
import { FaPaperclip, FaUnlink } from 'react-icons/fa';
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
  canDelete: boolean;
  onAttach: (where: number[], attach: boolean) => () => void;
  onPlayStatus: (mediaId: string) => void;
  onDelete: (i: number) => () => void;
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
    onDelete,
    isPlaying,
    attached,
    canDelete,
  } = props;
  const classes = useStyles();

  const handlePlayStatus = () => {
    onPlayStatus(isPlaying ? '' : mediaId);
  };

  const handleAttach = () => {
    onAttach([rowIndex], !attached);
  };

  const handleDelete = () => {
    onDelete(rowIndex);
  };

  return (
    <div className={classes.arrangeActions}>
      {(isElectron || online) && (
        <IconButton
          className={classes.actionButton}
          title={t.playpause}
          disabled={(mediaId || '') === ''}
          onClick={handlePlayStatus}
        >
          {isPlaying ? <StopIcon /> : <PlayIcon />}
        </IconButton>
      )}
      {!readonly && (
        <IconButton
          className={classes.actionButton}
          title={t.attach}
          onClick={handleAttach}
        >
          {!attached ? (
            <FaPaperclip className={classes.icon} />
          ) : (
            <FaUnlink className={classes.icon} />
          )}
        </IconButton>
      )}
      {canDelete && !readonly && (
        <IconButton
          className={classes.actionButton}
          title={t.delete}
          onClick={handleDelete}
        >
          <DeleteIcon />
        </IconButton>
      )}
    </div>
  );
}
const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'mediaActions' }),
});
export default (connect(mapStateToProps)(MediaActions) as any) as any;
