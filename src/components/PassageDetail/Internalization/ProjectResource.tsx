import React, { useState, useContext, useEffect, useRef } from 'react';
import { MediaFile, IPassageDetailArtifactsStrings } from '../../../model';
import { QueryBuilder } from '@orbit/data';
import { withData } from '../../../mods/react-orbitjs';
import { makeStyles, createStyles, Theme } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import { MenuProps } from '@material-ui/core/Menu';
import { Button, Menu, MenuItem, ListItemText } from '@material-ui/core';
import InfoIcon from '@material-ui/icons/Info';
import { LightTooltip } from '../../StepEditor';
import { resourceSelector } from '../../../selector';
import { shallowEqual, useSelector } from 'react-redux';
import { PassageDetailContext } from '../../../context/PassageDetailContext';
import { useOrganizedBy } from '../../../crud';
import {
  useArtifactType,
  ArtifactTypeSlug,
} from '../../../crud/useArtifactType';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    button: { margin: theme.spacing(2) },
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
      horizontal: 'left',
    }}
    transformOrigin={{
      vertical: 'top',
      horizontal: 'left',
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

interface IRecordProps {
  mediafiles: MediaFile[];
}

interface IProps extends IRecordProps {
  action?: (what: string) => void;
  stopPlayer?: () => void;
}

export const ProjectResource = (props: IProps) => {
  const { action, stopPlayer, mediafiles } = props;
  const classes = useStyles();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { localizedArtifactType } = useArtifactType();
  const ctx = useContext(PassageDetailContext);
  const { getProjectResources } = ctx.state;
  const [hasProjRes, setHasProjRes] = useState(false);
  const mediaCount = useRef(0);
  const { getOrganizedBy } = useOrganizedBy();
  const t: IPassageDetailArtifactsStrings = useSelector(
    resourceSelector,
    shallowEqual
  );

  useEffect(() => {
    if (mediaCount.current !== mediafiles.length) {
      mediaCount.current = mediafiles.length;
      getProjectResources().then((res) => setHasProjRes(res.length > 0));
    }
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
      <Button
        id="add-resource"
        onClick={handleClick}
        variant="outlined"
        color="primary"
        className={classes.button}
      >
        {localizedArtifactType(ArtifactTypeSlug.ProjectResource)}
      </Button>
      <StyledMenu
        id="project-resource-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handle('Close')}
      >
        <StyledMenuItem id="projt-res-upl" onClick={handle('project-upload')}>
          <ListItemText>
            {t.uploadProject}
            {'\u00A0'}
            <LightTooltip
              title={t.tip2a.replace(
                '{0}',
                getOrganizedBy(false).toLocaleLowerCase()
              )}
            >
              <InfoIcon fontSize="small" />
            </LightTooltip>
          </ListItemText>
        </StyledMenuItem>
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
              <InfoIcon fontSize="small" />
            </LightTooltip>
          </ListItemText>
        </StyledMenuItem>
        {/* <StyledMenuItem id="referenceResource" onClick={handle('sheet')}>
          <ListItemText primary={t.projectResourceSheet} />
        </StyledMenuItem> */}
      </StyledMenu>
    </div>
  );
};

const mapRecordsToProps = {
  mediafiles: (q: QueryBuilder) => q.findRecords('mediafile'),
};

export default withData(mapRecordsToProps)(ProjectResource) as any;
