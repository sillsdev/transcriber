import * as React from 'react';
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import Speed from '@mui/icons-material/SlowMotionVideo';
import Check from '@mui/icons-material/Check';
import { useSelector, shallowEqual } from 'react-redux';
import { controlSelector } from '../selector';
import { IControlStrings } from '../model';

interface SpeedMenuProps {
  speed: number;
  onSpeed: (speed: number) => void;
}

const speedOpts = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

export default function SpeedMenu({ speed, onSpeed }: SpeedMenuProps) {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const t: IControlStrings = useSelector(controlSelector, shallowEqual);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <IconButton
        id="speed-button"
        data-testid="speed-button"
        aria-controls={open ? 'speed-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        sx={{ color: 'text.primary' }}
        onClick={handleClick}
      >
        <Speed />
      </IconButton>
      <Menu
        id="speed-menu"
        data-testid="speed-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'speed-button',
        }}
      >
        {speedOpts.map((s) => (
          <MenuItem
            key={s}
            onClick={() => {
              handleClose();
              onSpeed(s);
            }}
          >
            <ListItemIcon>{s === speed ? <Check /> : <></>}</ListItemIcon>
            <ListItemText>{s === 1 ? t.normal : `${s}x`}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
