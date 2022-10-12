import React from 'react';
import { useGlobal } from 'reactn';
import useTodo from '../context/useTodo';
import {
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Typography,
  Tooltip,
  Menu,
  MenuItem,
  Box,
  SxProps,
} from '@mui/material';
import { TransformBuilder } from '@orbit/data';
import {
  sectionNumber,
  sectionDescription,
  useOrganizedBy,
  useRole,
} from '../crud';
import PeopleIconOutline from '@mui/icons-material/PeopleAltOutlined';
import { TaskAvatar } from './TaskAvatar';
import { UpdateRelatedRecord } from '../model/baseModel';
import { TaskItemWidth } from './TaskTable';
import { Section } from '../model';

const menuItemProps = { display: 'flex', flexDirection: 'row' } as SxProps;

interface IProps {
  item: number;
}

export function TaskHead(props: IProps) {
  const { item } = props;
  const { rowData, taskItemStr, sharedStr } = useTodo();
  const { transcriber, editor, section } = rowData[item] || {
    transcriber: '',
    editor: '',
    section: {} as Section,
  };
  const [memory] = useGlobal('memory');
  const [user] = useGlobal('user');
  const [menuItem, setMenuItem] = React.useState(null);
  const { getOrganizedBy } = useOrganizedBy();
  const { userCanBeEditor } = useRole();

  const t = taskItemStr;
  const ts = sharedStr;

  const planHead = t.section
    .replace('{0}', getOrganizedBy(true))
    .replace('{1}', sectionNumber(section))
    .replace('{2}', '');

  const assignAction = t.assign;
  const unassignAction = t.unassign;
  const tranAction =
    transcriber && transcriber !== '' ? unassignAction : assignAction;
  const editAction = editor && editor !== '' ? unassignAction : assignAction;

  const handleMenu = (e: any) => setMenuItem(e.currentTarget);
  const handleAction = (action: string, role?: string) => () => {
    if (/Close/i.test(action)) {
      setMenuItem(null);
    } else {
      if (role) {
        memory.update((t: TransformBuilder) =>
          UpdateRelatedRecord(
            t,
            section,
            role,
            'user',
            action === assignAction ? user : '',
            user
          )
        );
      }
    }
  };

  return (
    <List sx={{ width: '100%', minWidth: `${TaskItemWidth}px` }}>
      <Divider component="li" />
      <ListItem alignItems="flex-start">
        <ListItemAvatar sx={{ minWidth: 4 }}>
          <>{'\u00A0'}</>
        </ListItemAvatar>
        <ListItemText
          primary={
            <Tooltip
              title={sectionDescription(section)}
              placement="right-start"
            >
              <Typography>{planHead}</Typography>
            </Tooltip>
          }
        />
        <Menu
          id="taskMenu"
          anchorEl={menuItem}
          open={Boolean(menuItem)}
          onClose={handleAction('Close')}
        >
          <MenuItem
            id="taskTrans"
            onClick={handleAction(tranAction, 'transcriber')}
          >
            {
              <Box sx={menuItemProps}>
                <>{tranAction.replace('{0}', ts.transcriber) + '\u00A0'}</>
                <TaskAvatar
                  assigned={
                    transcriber && transcriber !== '' ? transcriber : user
                  }
                />
              </Box>
            }
          </MenuItem>
          <MenuItem
            id="taskEditor"
            onClick={handleAction(editAction, 'editor')}
            disabled={!userCanBeEditor()}
          >
            {
              <Box sx={menuItemProps}>
                <>{editAction.replace('{0}', ts.editor) + '\u00A0'}</>
                <TaskAvatar
                  assigned={editor && editor !== '' ? editor : user}
                />
              </Box>
            }
          </MenuItem>
        </Menu>
        <ListItemSecondaryAction>
          <IconButton
            id="taskAssign"
            size="small"
            onClick={handleMenu}
            aria-owns={menuItem !== '' ? 'action-menu' : undefined}
          >
            <PeopleIconOutline />
          </IconButton>
        </ListItemSecondaryAction>
      </ListItem>
    </List>
  );
}

export default TaskHead;
