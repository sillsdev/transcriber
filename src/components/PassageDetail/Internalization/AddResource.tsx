import React, { useContext, useEffect, useMemo, useState } from 'react';
import { IPassageDetailArtifactsStrings, MediaFile } from '../../../model';
import { ListItemText, Divider } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import { LightTooltip } from '../../../control';
import { related, useOrganizedBy, usePlanType } from '../../../crud';
import { resourceSelector } from '../../../selector';
import { shallowEqual, useSelector } from 'react-redux';
import { QueryBuilder } from '@orbit/data';
import { withData } from 'react-orbitjs';
import { PassageDetailContext } from '../../../context/PassageDetailContext';
import { PriButton, StyledMenu, StyledMenuItem } from '../../../control';

interface IRecordProps {
  mediafiles: MediaFile[];
}
interface IProps extends IRecordProps {
  action?: (what: string) => void;
  stopPlayer?: () => void;
}

export const AddResource = (props: IProps) => {
  const { action, stopPlayer, mediafiles } = props;
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { getOrganizedBy } = useOrganizedBy();
  const planType = usePlanType();
  const ctx = useContext(PassageDetailContext);
  const { section, getProjectResources } = ctx.state;
  const t: IPassageDetailArtifactsStrings = useSelector(
    resourceSelector,
    shallowEqual
  );
  const [hasProjRes, setHasProjRes] = useState(false);

  const isFlat = useMemo(() => {
    return planType(related(section, 'plan'))?.flat;
  }, [planType, section]);

  useEffect(() => {
    getProjectResources().then((res) => setHasProjRes(res.length > 0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediafiles]);

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
      <PriButton id="add-resource" onClick={handleClick}>
        {t.add}
      </PriButton>
      <StyledMenu
        id="customized-menu"
        anchorEl={anchorEl}
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
        {!isFlat && (
          <StyledMenuItem
            id="referencePassageResource"
            onClick={handle('ref-passage')}
          >
            <ListItemText>
              {t.sharedResource.replace('{0}', t.passageResource)}
              {'\u00A0'}
              <LightTooltip
                title={t.tip1b.replace(
                  '{0}',
                  t.passageResource.toLocaleLowerCase()
                )}
              >
                <InfoIcon />
              </LightTooltip>
            </ListItemText>
          </StyledMenuItem>
        )}
        <StyledMenuItem
          id="referenceSectionResource"
          onClick={handle('ref-section')}
        >
          <ListItemText>
            {t.sharedResource.replace('{0}', getOrganizedBy(true))}
            {'\u00A0'}
            <LightTooltip
              title={t.tip1b.replace(
                '{0}',
                getOrganizedBy(true).toLocaleLowerCase()
              )}
            >
              <InfoIcon />
            </LightTooltip>
          </ListItemText>
        </StyledMenuItem>
        <Divider />
        <StyledMenuItem
          id="proj-res-config"
          onClick={handle('wizard')}
          disabled={!hasProjRes}
        >
          <ListItemText>
            {t.configure}
            {'\u00A0'}
            <LightTooltip
              title={t.tip2b.replace(
                '{0}',
                getOrganizedBy(false).toLocaleLowerCase()
              )}
            >
              <InfoIcon />
            </LightTooltip>
          </ListItemText>
        </StyledMenuItem>
      </StyledMenu>
    </div>
  );
};

const mapRecordsToProps = {
  mediafiles: (q: QueryBuilder) => q.findRecords('mediafile'),
};

export default withData(mapRecordsToProps)(AddResource) as any;
