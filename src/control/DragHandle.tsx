import { makeStyles } from '@material-ui/core';
import { SortableHandle } from 'react-sortable-hoc';

const useStyles = makeStyles({
  handle: { cursor: 'move' },
});

export const DragHandle = SortableHandle(() => {
  const classes = useStyles();

  return <span className={classes.handle}>::</span>;
});
