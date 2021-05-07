import React from 'react';
import { createStyles, Theme, makeStyles } from '@material-ui/core/styles';
import {
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Typography,
} from '@material-ui/core';
import useTodo from '../context/useTodo';
import TaskFlag from './TaskFlag';
import { Duration } from '../control';
import {
  related,
  sectionNumber,
  passageNumber,
  passageReference,
} from '../crud';
import { NextAction } from './TaskFlag';
import TaskAvatar from './TaskAvatar';
import { UnsavedContext } from '../context/UnsavedContext';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      width: '100%',
      minWidth: 360,
    },
    detail: {
      display: 'flex',
      flexDirection: 'column',
    },
    detailAlign: {
      display: 'flex',
      flexDirection: 'row-reverse',
    },
    listAvatar: {
      minWidth: theme.spacing(4),
    },
  })
);

interface IProps {
  item: number;
  organizedBy: string;
}

export function TaskItem(props: IProps) {
  const { organizedBy } = props;
  const classes = useStyles();
  const {
    rowData,
    taskItemStr,
    activityStateStr,
    setSelected,
    setAllDone,
    allBookData,
  } = useTodo();
  const uctx = React.useContext(UnsavedContext);
  const { checkSavedFn } = uctx.state;

  // TT-1749 during refresh the index went out of range.
  if (props.item >= rowData.length) return <></>;
  const { passage, section, duration } = rowData[props.item];
  const t = taskItemStr;

  const handleSelect = (selected: string) => () => {
    setAllDone(false);
    checkSavedFn(() => setSelected(selected));
  };

  let assigned: string | null = null;
  const attr = passage.attributes;
  if (attr) {
    const next = NextAction({
      ta: activityStateStr,
      state: attr.state,
    });
    if (next === activityStateStr.transcribe)
      assigned = related(section, 'transcriber');
    if (next === activityStateStr.review) assigned = related(section, 'editor');
  }

  return (
    <List className={classes.root}>
      <ListItem
        id="taskSelect"
        alignItems="flex-start"
        onClick={handleSelect(passage.id)}
      >
        <ListItemAvatar className={classes.listAvatar}>
          <TaskAvatar assigned={assigned} />
        </ListItemAvatar>
        <ListItemText
          disableTypography
          primary={
            <Typography>{passageReference(passage, allBookData)}</Typography>
          }
          secondary={<TaskFlag ta={activityStateStr} state={attr?.state} />}
        />
        <ListItemSecondaryAction>
          <div className={classes.detail}>
            <div className={classes.detailAlign}>
              <Duration seconds={duration} />
            </div>
            <div className={classes.detailAlign}>
              {t.section
                .replace('{0}', organizedBy)
                .replace('{1}', sectionNumber(section))
                .replace('{2}', passageNumber(passage).trim())}
            </div>
          </div>
        </ListItemSecondaryAction>
      </ListItem>
      {/* <Divider variant="inset" component="li" /> */}
    </List>
  );
}

export default TaskItem;
