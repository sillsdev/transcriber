import React from 'react';
import { ISharedStrings, IPlanActionsStrings, IState } from '../model';
import { makeStyles, Theme, createStyles, IconButton } from '@material-ui/core';
import AssignIcon from '@material-ui/icons/PeopleAltOutlined';
import DeleteIcon from '@material-ui/icons/DeleteOutline';
import TranscribeIcon from '@material-ui/icons/EditOutlined';
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
  onDelete: (i: number) => () => void;
}

export function PlanActions(props: IProps) {
  const {
    t,
    rowIndex,
    isSection,
    isPassage,
    mediaId,
    readonly,
    onTranscribe,
    onAssign,
    onDelete,
    canAssign,
    canDelete,
  } = props;
  const classes = useStyles();

  return (
    <div className={classes.arrangeActions}>
      {isSection && canAssign && !readonly && (
        <IconButton
          id="planActAssign"
          className={classes.actionButton}
          title={t.assign}
          onClick={onAssign([rowIndex])}
        >
          <AssignIcon />
        </IconButton>
      )}
      {isPassage && (
        <IconButton
          id="planActTrans"
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
          id="planActDel"
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
