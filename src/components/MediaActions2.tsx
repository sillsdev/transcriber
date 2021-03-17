import React from 'react';
import { IMediaActionsStrings, IState } from '../model';
import { makeStyles, Theme, createStyles, IconButton } from '@material-ui/core';
import DownloadIcon from '@material-ui/icons/GetAppOutlined';
import DeleteIcon from '@material-ui/icons/DeleteOutline';
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
    download: {
      fill: theme.palette.primary.light,
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
  canDelete: boolean;
  onDownload: (mediaId: string) => void;
  onDelete: (i: number) => () => void;
}

export function MediaActions2(props: IProps) {
  const {
    t,
    rowIndex,
    mediaId,
    online,
    readonly,
    onDownload,
    onDelete,
    canDelete,
  } = props;
  const classes = useStyles();

  const handleDownload = () => {
    onDownload(mediaId);
  };

  const handleDelete = () => {
    onDelete(rowIndex);
  };

  return (
    <div className={classes.arrangeActions}>
      {(isElectron || online) && (
        <IconButton
          className={classes.actionButton}
          title={t.download}
          disabled={(mediaId || '') === ''}
          onClick={handleDownload}
        >
          <DownloadIcon />
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
export default (connect(mapStateToProps)(MediaActions2) as any) as any;
