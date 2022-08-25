import React from 'react';
import { ISortMenuStrings } from '../../model';
import { IconButton, ListItemIcon, ListItemText, Badge } from '@mui/material';
import SortIcon from '@mui/icons-material/Sort';
import RadioOff from '@mui/icons-material/RadioButtonUnchecked';
import RadioOn from '@mui/icons-material/RadioButtonChecked';
import { StyledMenu, StyledMenuItem } from '../../control';
import { sortMenuSelector } from '../../selector';
import { shallowEqual, useSelector } from 'react-redux';

export interface ISortState {
  topic: boolean;
  lastUpdated: boolean;
  assignedTo: boolean;
  [key: string]: boolean;
}

interface IProps {
  state: ISortState;
  action?: (what: string) => void;
  stopPlayer?: () => void;
  disabled?: boolean;
}

export function SortMenu(props: IProps) {
  const { action, stopPlayer, disabled } = props;
  const { topic, assignedTo, lastUpdated } = props.state;
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const t: ISortMenuStrings = useSelector(sortMenuSelector, shallowEqual);

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
    <Badge
      badgeContent={topic ? 0 : ' '}
      overlap="circular"
      variant="dot"
      color="secondary"
    >
      <IconButton
        id="SortMenu"
        aria-controls="sort-menu"
        aria-haspopup="true"
        title={t.sortMenu}
        sx={{ color: 'primary.light' }}
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
    </Badge>
  );
}

export default SortMenu;
