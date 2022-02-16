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
import { Duration, ItemDescription } from '../control';
import {
  related,
  sectionNumber,
  passageNumber,
  passageReference,
} from '../crud';
import { NextAction } from './TaskFlag';
import TaskAvatar from './TaskAvatar';
import { UnsavedContext } from '../context/UnsavedContext';
import { TaskItemWidth } from './TaskTable';
import { ActivityStates } from '../model';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      width: '100%',
      minWidth: `${TaskItemWidth}px`,
    },
    row: {
      display: 'flex',
      flexDirection: 'row',
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
    grow: {
      flexGrow: 1,
    },
  })
);

interface IProps {
  item: number;
  organizedBy: string;
  flat: boolean;
}

export function TaskItem(props: IProps) {
  const { flat } = props;
  const classes = useStyles();
  const {
    rowData,
    activityStateStr,
    selected,
    allDone,
    setSelected,
    refresh,
    setAllDone,
    allBookData,
  } = useTodo();
  const uctx = React.useContext(UnsavedContext);
  const { checkSavedFn } = uctx.state;

  // TT-1749 during refresh the index went out of range.
  if (props.item >= rowData.length) return <></>;
  const { mediafile, passage, section, duration } = rowData[props.item];

  const handleSelect = (select: string) => () => {
    //if we're all done, we can't need to save
    if (allDone && select === selected) {
      setAllDone(false);
    } else
      checkSavedFn(() => {
        if (select !== selected) setSelected(select);
        else refresh();
      });
  };

  let assigned: string | null = null;
  const attr = mediafile.attributes;
  if (attr) {
    const next = NextAction({
      ta: activityStateStr,
      state: attr.transcriptionstate || ActivityStates.TranscribeReady,
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
        onClick={handleSelect(mediafile.id)}
      >
        <ListItemAvatar className={classes.listAvatar}>
          <TaskAvatar assigned={assigned} />
        </ListItemAvatar>
        <ListItemText
          disableTypography
          primary={
            <div>
              <div className={classes.row}>
                <Typography>
                  {passageReference(passage, allBookData)}
                </Typography>
                <div className={classes.grow}> </div>
                {'\u00A0'}
                {'{1}.{2}'
                  .replace('{1}', sectionNumber(section))
                  .replace('{2}', passageNumber(passage).trim())}
              </div>
              {related(mediafile, 'artifactType') && (
                <ItemDescription mediafile={mediafile} col={true} />
              )}
            </div>
          }
          secondary={
            <div className={classes.row}>
              <TaskFlag
                ta={activityStateStr}
                state={
                  attr?.transcriptionstate || ActivityStates.TranscribeReady
                }
              />
              <div className={classes.grow}> </div>
              {'\u00A0'}
              <Duration seconds={duration} />
            </div>
          }
        />
      </ListItem>
      {/* <Divider variant="inset" component="li" /> */}
    </List>
  );
}

export default TaskItem;
