import React from 'react';
import { ITranscriptionTabStrings } from '../model';
import { ListItemText } from '@mui/material';
import { PriButton, StyledMenu, StyledMenuItem } from '../control';
import { transcriptionTabSelector } from '../selector';
import { shallowEqual, useSelector } from 'react-redux';

interface IProps {
  action?: (what: string) => void;
  localizedArtifact: string;
  isScripture: boolean;
  stopPlayer?: () => void;
}

export function AudioExportMenu(props: IProps) {
  const { action, localizedArtifact, isScripture, stopPlayer } = props;
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const t: ITranscriptionTabStrings = useSelector(
    transcriptionTabSelector,
    shallowEqual
  );

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
      <PriButton
        id="audio-export"
        aria-controls="audio-export-menu"
        aria-haspopup="true"
        aria-owns={anchorEl ? 'audio-export-menu' : undefined}
        sx={{ color: 'background.paper' }}
        onClick={handleClick}
      >
        {t.audioExport}
      </PriButton>
      <StyledMenu
        id="audio-export-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handle('Close')}
      >
        <StyledMenuItem
          id="zipExport"
          aria-hidden={!Boolean(anchorEl)}
          onClick={handle('zip')}
        >
          <ListItemText
            primary={
              t.latestAudio +
              (localizedArtifact ? ' (' + localizedArtifact + ')' : '')
            }
          />
        </StyledMenuItem>
        {isScripture && (
          <StyledMenuItem
            id="burritoExport"
            aria-hidden={!Boolean(anchorEl)}
            onClick={handle('burrito')}
          >
            <ListItemText primary={t.scriptureBurrito} />
          </StyledMenuItem>
        )}
      </StyledMenu>
    </div>
  );
}

export default AudioExportMenu;