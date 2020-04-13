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
import Duration from './Duration';
import {
  related,
  sectionNumber,
  passageNumber,
  passageReference,
} from '../utils';
import { NextAction } from './TaskFlag';
import TaskAvatar from './TaskAvatar';

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
}

export function TaskItem(props: IProps) {
  const { rowData, taskItemStr, setSelected, allBookData } = useTodo();
  const { passage, section, duration } = rowData[props.item];
  const classes = useStyles();
  const t = taskItemStr;

  const handleSelect = (selected: string) => () => {
    setSelected(selected);
  };

  let assigned: string | null = null;
  const attr = passage.attributes;
  if (attr) {
    const next = NextAction({ t: taskItemStr, state: attr.state });
    if (next === t.transcribe) assigned = related(section, 'transcriber');
    if (next === t.review) assigned = related(section, 'editor');
  }

  return (
    <List className={classes.root}>
      <ListItem alignItems="flex-start" onClick={handleSelect(passage.id)}>
        <ListItemAvatar className={classes.listAvatar}>
          <TaskAvatar assigned={assigned} />
        </ListItemAvatar>
        <ListItemText
          disableTypography
          primary={
            <Typography>{passageReference(passage, allBookData)}</Typography>
          }
          secondary={<TaskFlag t={t} state={attr?.state} />}
        />
        <ListItemSecondaryAction>
          <div className={classes.detail}>
            <div className={classes.detailAlign}>
              <Duration seconds={duration} />
            </div>
            <div className={classes.detailAlign}>
              {t.section
                .replace('{0}', sectionNumber(section))
                .replace('{1}', passageNumber(passage).trim())}
            </div>
          </div>
        </ListItemSecondaryAction>
      </ListItem>
      {/* <Divider variant="inset" component="li" /> */}
    </List>
  );
}

export default TaskItem;
