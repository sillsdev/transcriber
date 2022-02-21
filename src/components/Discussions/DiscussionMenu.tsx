import React from 'react';
import { connect } from 'react-redux';
import { IState, IDiscussionMenuStrings } from '../../model';
import localStrings from '../../selector/localize';
import { withStyles } from '@material-ui/core/styles';
import { MenuProps } from '@material-ui/core/Menu';
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@material-ui/core';
import { makeStyles, createStyles, Theme } from '@material-ui/core';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import EditIcon from '@material-ui/icons/Edit';
import DeleteIcon from '@material-ui/icons/Delete';
import ResolveIcon from '@material-ui/icons/Check';
import ReopenIcon from '@material-ui/icons/Unarchive';
import LinkIcon from '@material-ui/icons/Link';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    icon: {
      color: theme.palette.background.paper,
    },
  })
);

const StyledMenu = withStyles({
  paper: {
    border: '1px solid #d3d4d5',
  },
})((props: MenuProps) => (
  <Menu
    elevation={0}
    getContentAnchorEl={null}
    anchorOrigin={{
      vertical: 'bottom',
      horizontal: 'right',
    }}
    transformOrigin={{
      vertical: 'top',
      horizontal: 'right',
    }}
    {...props}
  />
));

const StyledMenuItem = withStyles((theme) => ({
  root: {
    '&:focus': {
      backgroundColor: theme.palette.primary.main,
      '& .MuiListItemIcon-root, & .MuiListItemText-primary': {
        color: theme.palette.common.white,
      },
    },
  },
}))(MenuItem);

interface IStateProps {
  t: IDiscussionMenuStrings;
}

interface IProps extends IStateProps {
  action?: (what: string) => void;
  resolved?: boolean;
  canSet: boolean;
  stopPlayer?: () => void;
}

export function DiscussionMenu(props: IProps) {
  const { action, t, resolved, canSet, stopPlayer } = props;
  const classes = useStyles();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    if (stopPlayer) stopPlayer();
  };

  const handle = (what: string) => (e: React.MouseEvent) => {
    e.stopPropagation();
    setAnchorEl(null);
    if (action) {
      action(what);
    }
  };

  return (
    <div>
      <IconButton
        id="commentMenu"
        aria-controls="customized-menu"
        aria-haspopup="true"
        className={classes.icon}
        onClick={handleClick}
      >
        <MoreVertIcon />
      </IconButton>
      <StyledMenu
        id="customized-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handle('Close')}
      >
        {!resolved && (
          <StyledMenuItem id="commentEdit" onClick={handle('edit')}>
            <ListItemIcon>
              <EditIcon />
            </ListItemIcon>
            <ListItemText primary={t.edit} />
          </StyledMenuItem>
        )}
        <StyledMenuItem id="commentMenu" onClick={handle('delete')}>
          <ListItemIcon>
            <DeleteIcon />
          </ListItemIcon>
          <ListItemText primary={t.delete} />
        </StyledMenuItem>
        {resolved === false && (
          <StyledMenuItem id="resolve" onClick={handle('resolve')}>
            <ListItemIcon>
              <ResolveIcon />
            </ListItemIcon>
            <ListItemText primary={t.resolve} />
          </StyledMenuItem>
        )}
        {resolved && (
          <StyledMenuItem id="reopen" onClick={handle('reopen')}>
            <ListItemIcon>
              <ReopenIcon />
            </ListItemIcon>
            <ListItemText primary={t.reopen} />
          </StyledMenuItem>
        )}
        {canSet && (
          <StyledMenuItem id="set" onClick={handle('set')}>
            <ListItemIcon>
              <LinkIcon />
            </ListItemIcon>
            <ListItemText primary={t.setSegment} />
          </StyledMenuItem>
        )}
      </StyledMenu>
    </div>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'discussionMenu' }),
});

export default connect(mapStateToProps)(DiscussionMenu) as any;
