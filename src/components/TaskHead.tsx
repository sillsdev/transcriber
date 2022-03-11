import React from 'react';
import { useGlobal } from 'reactn';
import useTodo from '../context/useTodo';
import { createStyles, Theme, makeStyles } from '@material-ui/core/styles';
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
} from '@material-ui/core';
import { TransformBuilder } from '@orbit/data';
import {
  sectionNumber,
  sectionDescription,
  useOrganizedBy,
  useRole,
} from '../crud';
import PeopleIconOutline from '@material-ui/icons/PeopleAltOutlined';
import { TaskAvatar } from './TaskAvatar';
import { UpdateRelatedRecord } from '../model/baseModel';
import { TaskItemWidth } from './TaskTable';
import { Section } from '../model';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      width: '100%',
      minWidth: `${TaskItemWidth}px`,
    },
    menuItem: {
      display: 'flex',
      flexDirection: 'row',
    },
    listAvatar: {
      minWidth: theme.spacing(4),
    },
  })
);

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
  const classes = useStyles();
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
    <List className={classes.root}>
      <Divider component="li" />
      <ListItem alignItems="flex-start">
        <ListItemAvatar className={classes.listAvatar}>
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
              <div className={classes.menuItem}>
                <>{tranAction.replace('{0}', ts.transcriber) + '\u00A0'}</>
                <TaskAvatar
                  assigned={
                    transcriber && transcriber !== '' ? transcriber : user
                  }
                />
              </div>
            }
          </MenuItem>
          <MenuItem
            id="taskEditor"
            onClick={handleAction(editAction, 'editor')}
            disabled={!userCanBeEditor()}
          >
            {
              <div className={classes.menuItem}>
                <>{editAction.replace('{0}', ts.editor) + '\u00A0'}</>
                <TaskAvatar
                  assigned={editor && editor !== '' ? editor : user}
                />
              </div>
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
