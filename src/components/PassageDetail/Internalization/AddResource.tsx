import React, { useEffect, useState } from 'react';
import { IPassageDetailArtifactsStrings } from '../../../model';
import { ListItemText } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import { AltButton, LightTooltip } from '../../../control';
import { resourceSelector } from '../../../selector';
import { shallowEqual, useSelector } from 'react-redux';
import { StyledMenu, StyledMenuItem } from '../../../control';
import { useGlobal } from '../../../context/GlobalContext';
import usePassageDetailContext from '../../../context/usePassageDetailContext';
import { usePassageType } from '../../../crud/usePassageType';
import related from '../../../crud/related';
import { PassageTypeEnum } from '../../../model/passageType';

interface IProps {
  action?: (what: string) => void;
  stopPlayer?: () => void;
}

export const AddResource = (props: IProps) => {
  const { action, stopPlayer } = props;
  const { passage } = usePassageDetailContext();
  const { getPassageTypeFromId } = usePassageType();
  const [biblebrain, setBiblebrain] = useState(true);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [offline] = useGlobal('offline'); //verified this is not used in a function 2/18/25
  const [offlineOnly] = useGlobal('offlineOnly'); //will be constant here
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

  useEffect(() => {
    const pt = getPassageTypeFromId(related(passage, 'passagetype'));
    setBiblebrain(pt === PassageTypeEnum.PASSAGE);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passage]);

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
          <ListItemText>{t.upload}</ListItemText>
        </StyledMenuItem>
        {biblebrain && (
          <StyledMenuItem id="audioScripture" onClick={handle('scripture')}>
            <ListItemText>{t.audioScripture}</ListItemText>
          </StyledMenuItem>
        )}
        <StyledMenuItem id="linkResource" onClick={handle('link')}>
          <ListItemText>{t.linkResource}</ListItemText>
        </StyledMenuItem>
        <StyledMenuItem id="recordResource" onClick={handle('record')}>
          <ListItemText>{t.recordResource}</ListItemText>
        </StyledMenuItem>
        <StyledMenuItem id="textResource" onClick={handle('text')}>
          <ListItemText>{t.textResource}</ListItemText>
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
