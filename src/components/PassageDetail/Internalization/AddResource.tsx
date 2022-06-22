import React, { useState } from 'react';
import { IPassageDetailArtifactsStrings } from '../../../model';
import { makeStyles, createStyles, Theme } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import { MenuProps } from '@material-ui/core/Menu';
import { Button, Menu, MenuItem, ListItemText } from '@material-ui/core';
import InfoIcon from '@material-ui/icons/Info';
import { LightTooltip } from '../../../control';
import { useOrganizedBy } from '../../../crud';
import { resourceSelector } from '../../../selector';
import { shallowEqual, useSelector } from 'react-redux';

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

export const AddResource = (props: IProps) => {
  const { action, stopPlayer } = props;
  const classes = useStyles();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { getOrganizedBy } = useOrganizedBy();
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
        variant="contained"
        color="primary"
        className={classes.button}
      >
        {t.add}
      </Button>
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
            <LightTooltip
              title={t.tip1a.replace(
                '{0}',
                getOrganizedBy(true).toLocaleLowerCase()
              )}
            >
              <InfoIcon fontSize="small" />
            </LightTooltip>
          </ListItemText>
        </StyledMenuItem>
        <StyledMenuItem id="referenceResource" onClick={handle('reference')}>
          <ListItemText>
            {t.sharedResource}
            {'\u00A0'}
            <LightTooltip
              title={t.tip1b.replace(
                '{0}',
                getOrganizedBy(true).toLocaleLowerCase()
              )}
            >
              <InfoIcon fontSize="small" />
            </LightTooltip>
          </ListItemText>
        </StyledMenuItem>
        {/* <StyledMenuItem id="activity" onClick={handle('activity')}>
          <ListItemText primary={t.activity} />
        </StyledMenuItem> */}
      </StyledMenu>
    </div>
  );
};

export default AddResource;
