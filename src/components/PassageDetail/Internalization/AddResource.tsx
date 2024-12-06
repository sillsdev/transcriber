import React, { useState } from 'react';
import { IPassageDetailArtifactsStrings } from '../../../model';
import { ListItemText } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import { AltButton, LightTooltip } from '../../../control';
import { resourceSelector } from '../../../selector';
import { shallowEqual, useSelector } from 'react-redux';
import { StyledMenu, StyledMenuItem } from '../../../control';
import { useGlobal } from 'reactn';

interface IProps {
  action?: (what: string) => void;
  stopPlayer?: () => void;
}

export const AddResource = (props: IProps) => {
  const { action, stopPlayer } = props;
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [offline] = useGlobal('offline');
  const [offlineOnly] = useGlobal('offlineOnly');
  const t: IPassageDetailArtifactsStrings = useSelector(
    resourceSelector,
    shallowEqual
  );
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    if (stopPlayer) stopPlayer();
  };

  const handle = (what: string) => (event: React.MouseEvent) => {
    event.stopPropagation();
    setAnchorEl(null);
    if (action) {
      action(what);
    }
  };

  return (
    <div>
      <AltButton id="add-resource" onClick={handleClick}>
        {t.add}
      </AltButton>
      <StyledMenu
        id="customized-menu"
        anchorEl={anchorEl}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handle('Close')}
      >
        <StyledMenuItem id="uploadResource" onClick={handle('upload')}>
          <ListItemText>
            {t.upload}
            {'\u00A0'}
          </ListItemText>
        </StyledMenuItem>
        <StyledMenuItem id="linkResource" onClick={handle('link')}>
          <ListItemText>
            {t.linkResource}
            {'\u00A0'}
          </ListItemText>
        </StyledMenuItem>
        <StyledMenuItem id="recordResource" onClick={handle('record')}>
          <ListItemText>
            {t.recordResource}
            {'\u00A0'}
          </ListItemText>
        </StyledMenuItem>
        <StyledMenuItem id="textResource" onClick={handle('text')}>
          <ListItemText>
            {t.textResource}
            {'\u00A0'}
          </ListItemText>
        </StyledMenuItem>
        {!offline && !offlineOnly && (
          <StyledMenuItem id="sharedResource" onClick={handle('shared')}>
            <ListItemText>
              {t.sharedResource}
              {'\u00A0'}
              <LightTooltip title={t.tip1b}>
                <InfoIcon />
              </LightTooltip>
            </ListItemText>
          </StyledMenuItem>
        )}
      </StyledMenu>
    </div>
  );
};

export default AddResource;
