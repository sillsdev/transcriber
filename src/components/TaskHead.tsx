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
import { sectionNumber, sectionDescription } from '../utils';
import PeopleIcon from '@material-ui/icons/PeopleAlt';
import { TaskAvatar } from './TaskAvatar';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      width: '100%',
      minWidth: 360,
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
  const { rowData, taskItemStr } = useTodo();
  const { transcriber, editor } = rowData[item] || {
    transcriber: '',
    editor: '',
  };
  const { section } = rowData[props.item];
  const classes = useStyles();
  const [memory] = useGlobal('memory');
  const [user] = useGlobal('user');
  const [orgRole] = useGlobal('orgRole');
  const [projRole] = useGlobal('projRole');
  const [menuItem, setMenuItem] = React.useState(null);
  const t = taskItemStr;

  const planHead = t.section
    .replace('{0}', sectionNumber(section))
    .replace('{1}', '');

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
          t.replaceRelatedRecord(section, role, {
            type: 'user',
            id: action === assignAction ? user : '',
          })
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
          id="action-menu"
          anchorEl={menuItem}
          open={Boolean(menuItem)}
          onClose={handleAction('Close')}
        >
          <MenuItem
            onClick={handleAction(tranAction, 'transcriber')}
            disabled={
              tranAction === unassignAction &&
              transcriber !== user &&
              !/admin/i.test(orgRole) &&
              !/admin/i.test(projRole)
            }
          >
            {
              <div className={classes.menuItem}>
                <>{tranAction.replace('{0}', t.transcriber) + '\u00A0'}</>
                <TaskAvatar
                  assigned={
                    transcriber && transcriber !== '' ? transcriber : user
                  }
                />
              </div>
            }
          </MenuItem>
          <MenuItem
            onClick={handleAction(editAction, 'editor')}
            disabled={
              editAction === unassignAction &&
              editor !== user &&
              !/admin/i.test(orgRole) &&
              !/admin/i.test(projRole)
            }
          >
            {
              <div className={classes.menuItem}>
                <>{editAction.replace('{0}', t.editor) + '\u00A0'}</>
                <TaskAvatar
                  assigned={editor && editor !== '' ? editor : user}
                />
              </div>
            }
          </MenuItem>
        </Menu>
        <ListItemSecondaryAction>
          <IconButton
            size="small"
            onClick={handleMenu}
            aria-owns={menuItem !== '' ? 'action-menu' : undefined}
          >
            <PeopleIcon />
          </IconButton>
        </ListItemSecondaryAction>
      </ListItem>
    </List>
  );
}

export default TaskHead;
