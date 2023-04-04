import React from 'react';
import { IPassageDetailArtifactsStrings } from '../../../model';
import { IconButton, ListItemIcon, ListItemText } from '@mui/material';
import LevelIcon from '@mui/icons-material/DynamicFeed';
import RadioOff from '@mui/icons-material/RadioButtonUnchecked';
import RadioOn from '@mui/icons-material/RadioButtonChecked';
import { StyledMenu, StyledMenuItem } from '../../../control';
import { passageDetailArtifactsSelector } from '../../../selector';
import { shallowEqual, useSelector } from 'react-redux';
import { RefLevel } from './SelectSharedResource';

interface IProps {
  level: RefLevel;
  action?: (what: string) => void;
  disabled?: boolean;
}

export function RefLevelMenu(props: IProps) {
  const { level, action, disabled } = props;
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const t: IPassageDetailArtifactsStrings = useSelector(
    passageDetailArtifactsSelector,
    shallowEqual
  );

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
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
        title={t.chooseLevel}
        id="ref-level-menu"
        aria-controls="level-menu"
        aria-haspopup="true"
        sx={{ color: 'primary.light' }}
        onClick={handleClick}
        disabled={disabled}
      >
        <LevelIcon />
      </IconButton>
      <StyledMenu
        id="level-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handle('Close')}
      >
        <StyledMenuItem id="verse-level" onClick={handle('verse')}>
          <ListItemIcon>
            {level === RefLevel.Verse ? (
              <RadioOn id="radio-on" />
            ) : (
              <RadioOff id="radio-off" />
            )}
          </ListItemIcon>
          <ListItemText primary={t.verseLevel} />
        </StyledMenuItem>
        <StyledMenuItem id="chapter-level" onClick={handle('chapter')}>
          <ListItemIcon>
            {level === RefLevel.Chapter ? (
              <RadioOn id="radio-on" />
            ) : (
              <RadioOff id="radio-off" />
            )}
          </ListItemIcon>
          <ListItemText primary={t.chapterLevel} />
        </StyledMenuItem>
        <StyledMenuItem id="bool-level" onClick={handle('book')}>
          <ListItemIcon>
            {level === RefLevel.Book ? (
              <RadioOn id="radio-on" />
            ) : (
              <RadioOff id="radio-off" />
            )}
          </ListItemIcon>
          <ListItemText primary={t.bookLevel} />
        </StyledMenuItem>
        <StyledMenuItem id="all-level" onClick={handle('all')}>
          <ListItemIcon>
            {level === RefLevel.All ? (
              <RadioOn id="radio-on" />
            ) : (
              <RadioOff id="radio-off" />
            )}
          </ListItemIcon>
          <ListItemText primary={t.allLevel} />
        </StyledMenuItem>
      </StyledMenu>
    </>
  );
}

export default RefLevelMenu;
