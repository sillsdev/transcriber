import React from 'react';
import { ExportType, ITranscriptionTabStrings } from '../model';
import { ListItemText } from '@mui/material';
import { AltButton, StyledMenu, StyledMenuItem } from '../control';
import { transcriptionTabSelector } from '../selector';
import { shallowEqual, useSelector } from 'react-redux';

interface IProps {
  action?: (what: string | ExportType) => void;
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
    <>
      <AltButton
        id="audio-export"
        aria-controls="audio-export-menu"
        aria-haspopup="true"
        aria-owns={anchorEl ? 'audio-export-menu' : undefined}
        onClick={handleClick}
      >
        {t.audioExport}
      </AltButton>
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
          onClick={handle(ExportType.AUDIO)}
        >
          <ListItemText
            primary={
              t.latestAudio +
              (localizedArtifact ? ' (' + localizedArtifact + ')' : '')
            }
          />
        </StyledMenuItem>
        <StyledMenuItem
          id="zipExport"
          aria-hidden={!Boolean(anchorEl)}
          onClick={handle(ExportType.ELAN)}
        >
          <ListItemText
            primary={
              t.latestAudioElan +
              (localizedArtifact ? ' (' + localizedArtifact + ')' : '')
            }
          />
        </StyledMenuItem>
        {isScripture && (
          <StyledMenuItem
            id="burritoExport"
            aria-hidden={!Boolean(anchorEl)}
            onClick={handle(ExportType.BURRITO)}
          >
            <ListItemText primary={t.scriptureBurrito} />
          </StyledMenuItem>
        )}
      </StyledMenu>
    </>
  );
}

export default AudioExportMenu;
