import React from 'react';
import { connect } from 'react-redux';
import { IState, ISortMenuStrings } from '../../model';
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
import SortIcon from '@material-ui/icons/Sort';
import RadioOff from '@material-ui/icons/RadioButtonUnchecked';
import RadioOn from '@material-ui/icons/RadioButtonChecked';

export interface ISortState {
  topic: boolean;
  lastUpdated: boolean;
  assignedTo: boolean;
  [key: string]: boolean;
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    icon: {
      color: theme.palette.primary.light,
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
  t: ISortMenuStrings;
}

interface IProps extends IStateProps {
  state: ISortState;
  action?: (what: string) => void;
  stopPlayer?: () => void;
  disabled?: boolean;
}

export function SortMenu(props: IProps) {
  const { action, t, stopPlayer, disabled } = props;
  const { topic, assignedTo, lastUpdated } = props.state;
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
    <>
      <IconButton
        id="SortMenu"
        aria-controls="sort-menu"
        aria-haspopup="true"
        className={classes.icon}
        onClick={handleClick}
        disabled={disabled}
      >
        <SortIcon />
      </IconButton>
      <StyledMenu
        id="Sort-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handle('Close')}
      >
        <StyledMenuItem id="topic-filt" onClick={handle('topic')}>
          <ListItemIcon>
            {topic ? <RadioOn id="topicon" /> : <RadioOff id="topicoff" />}
          </ListItemIcon>
          <ListItemText primary={t.topic} />
        </StyledMenuItem>
        <StyledMenuItem id="lastUpdated-filt" onClick={handle('lastUpdated')}>
          <ListItemIcon>
            {lastUpdated ? (
              <RadioOn id="lastUpdatedon" />
            ) : (
              <RadioOff id="lastUpdatedoff" />
            )}
          </ListItemIcon>
          <ListItemText primary={t.lastUpdated} />
        </StyledMenuItem>
        <StyledMenuItem id="assignedTo-filt" onClick={handle('assignedTo')}>
          <ListItemIcon>
            {assignedTo ? (
              <RadioOn id="assignedon" />
            ) : (
              <RadioOff id="assignedoff" />
            )}
          </ListItemIcon>
          <ListItemText primary={t.assignment} />
        </StyledMenuItem>
      </StyledMenu>
    </>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'sortMenu' }),
});

export default connect(mapStateToProps)(SortMenu) as any;
