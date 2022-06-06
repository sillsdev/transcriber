import { makeStyles } from '@material-ui/core';
import { SortableHandle } from 'react-sortable-hoc';
import { LightTooltip } from './LightTooltip';
import { IMediaActionsStrings } from '../model';
import { mediaActionsSelector } from '../selector';
import { shallowEqual, useSelector } from 'react-redux';

const useStyles = makeStyles({
  handle: { cursor: 'move' },
});

export const DragHandle = SortableHandle(() => {
  const classes = useStyles();
  const t: IMediaActionsStrings = useSelector(
    mediaActionsSelector,
    shallowEqual
  );

  return (
    <LightTooltip title={t.drag}>
      <span className={classes.handle}>::</span>
    </LightTooltip>
  );
});
