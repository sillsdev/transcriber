import React, { useState } from 'react';
import { IPassageDetailArtifactsStrings } from '../../../model';
import { makeStyles, createStyles, Theme } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import { MenuProps } from '@material-ui/core/Menu';
import { Button, Menu, MenuItem, ListItemText } from '@material-ui/core';
import { resourceSelector } from '../../../selector';
import { shallowEqual, useSelector } from 'react-redux';
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

interface IProps {
  action?: (what: string) => void;
  stopPlayer?: () => void;
}

export const ProjectResource = (props: IProps) => {
  const { action, stopPlayer } = props;
  const classes = useStyles();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { localizedArtifactType } = useArtifactType();
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
        id="customized-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handle('Close')}
      >
        <StyledMenuItem id="uploadResource" onClick={handle('project-upload')}>
          <ListItemText primary={t.uploadProject} />
        </StyledMenuItem>
        <StyledMenuItem id="referenceResource" onClick={handle('wizard')}>
          <ListItemText primary={t.projectResourceWizard} />
        </StyledMenuItem>
        {/* <StyledMenuItem id="referenceResource" onClick={handle('sheet')}>
          <ListItemText primary={t.projectResourceSheet} />
        </StyledMenuItem> */}
      </StyledMenu>
    </div>
  );
};

export default ProjectResource;
