import React from 'react';
import { useGlobal } from 'reactn';
import { connect } from 'react-redux';
import { IState, ITaskItemStrings, MediaDescription } from '../model';
import localStrings from '../selector/localize';
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
import { related, sectionNumber } from '../utils';
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

interface IStateProps {
  t: ITaskItemStrings;
}

interface IProps extends IStateProps {
  mediaDesc: MediaDescription;
}

export function TaskHead(props: IProps) {
  const { t } = props;
  const { section } = props.mediaDesc;
  const classes = useStyles();
  const [memory] = useGlobal('memory');
  const [user] = useGlobal('user');
  const [orgRole] = useGlobal('orgRole');
  const [projRole] = useGlobal('projRole');
  const [menuItem, setMenuItem] = React.useState(null);

  const planHead = t.section
    .replace('{0}', sectionNumber(section))
    .replace('{1}', '');
  const planName = section.attributes.name;

  const trans = related(section, 'transcriber');
  const rev = related(section, 'editor');
  const assignAction = t.assign;
  const unassignAction = t.unassign;
  const tranAction = trans && trans !== '' ? unassignAction : assignAction;
  const revAction = rev && rev !== '' ? unassignAction : assignAction;

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
            <Tooltip title={planName} placement="right-start">
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
              trans !== user &&
              !/admin/i.test(orgRole) &&
              !/admin/i.test(projRole)
            }
          >
            {
              <div className={classes.menuItem}>
                <>{tranAction.replace('{0}', t.transcriber) + '\u00A0'}</>
                <TaskAvatar assigned={trans && trans !== '' ? trans : user} />
              </div>
            }
          </MenuItem>
          <MenuItem
            onClick={handleAction(revAction, 'editor')}
            disabled={
              revAction === unassignAction &&
              rev !== user &&
              !/admin/i.test(orgRole) &&
              !/admin/i.test(projRole)
            }
          >
            {
              <div className={classes.menuItem}>
                <>{revAction.replace('{0}', t.editor) + '\u00A0'}</>
                <TaskAvatar assigned={rev && rev !== '' ? rev : user} />
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

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'taskItem' }),
});

export default connect(mapStateToProps)(TaskHead) as any;
