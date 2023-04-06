import React from 'react';
import {
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Typography,
  Box,
  SxProps,
} from '@mui/material';
import useTodo from '../context/useTodo';
import TaskFlag from './TaskFlag';
import { Duration, GrowingSpacer, ItemDescription } from '../control';
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
import usePassageDetailContext from '../context/usePassageDetailContext';

const rowProp = { display: 'flex', flexDirection: 'row' } as SxProps;

interface IProps {
  item: number;
  organizedBy: string;
  flat: boolean;
}

export function TaskItem(props: IProps) {
  const { flat } = props;
  const {
    rowData,
    activityStateStr,
    allDone,
    refresh,
    setAllDone,
    allBookData,
  } = useTodo();
  const uctx = React.useContext(UnsavedContext);
  const { playerMediafile, setSelected } = usePassageDetailContext();
  const { checkSavedFn } = uctx.state;

  // TT-1749 during refresh the index went out of range.
  if (props.item >= rowData.length) return <></>;
  const { mediafile, passage, section, duration } = rowData[props.item];

  const handleSelect = (select: string) => () => {
    //if we're all done, we can't need to save
    if (allDone && select === playerMediafile?.id) {
      setAllDone(false);
    } else
      checkSavedFn(() => {
        if (select !== playerMediafile?.id) setSelected(select, true);
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
    <List sx={{ width: '100%', minWidth: `${TaskItemWidth}px` }}>
      <ListItem
        id="taskSelect"
        alignItems="flex-start"
        onClick={handleSelect(mediafile.id)}
      >
        <ListItemAvatar sx={{ minWidth: 4 }}>
          <TaskAvatar assigned={assigned} />
        </ListItemAvatar>
        <ListItemText
          disableTypography
          primary={
            <div>
              <Box sx={rowProp}>
                <Typography>
                  {passageReference(passage, allBookData)}
                </Typography>
                {!flat && (
                  <>
                    <GrowingSpacer />
                    {'{1}.{2}'
                      .replace('{1}', sectionNumber(section))
                      .replace('{2}', passageNumber(passage).trim())}
                  </>
                )}
              </Box>
              {related(mediafile, 'artifactType') && (
                <ItemDescription mediafile={mediafile} col={true} />
              )}
            </div>
          }
          secondary={
            <Box sx={rowProp}>
              <TaskFlag
                ta={activityStateStr}
                state={
                  attr?.transcriptionstate || ActivityStates.TranscribeReady
                }
              />
              <GrowingSpacer />
              <Duration seconds={duration} />
            </Box>
          }
        />
      </ListItem>
      {/* <Divider variant="inset" component="li" /> */}
    </List>
  );
}

export default TaskItem;
