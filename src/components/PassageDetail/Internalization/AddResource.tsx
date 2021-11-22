import React, { useState } from 'react';
import { connect } from 'react-redux';
import { IPassageDetailArtifactsStrings, IState } from '../../../model';
import localStrings from '../../../selector/localize';
import { makeStyles, createStyles, Theme } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import { MenuProps } from '@material-ui/core/Menu';
import { Button, Menu, MenuItem, ListItemText } from '@material-ui/core';

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

interface IStateProps {
  t: IPassageDetailArtifactsStrings;
}

interface IProps extends IStateProps {
  action?: (what: string) => void;
  stopPlayer?: () => void;
}

export const AddResource = (props: IProps) => {
  const { action, stopPlayer, t } = props;
  const classes = useStyles();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

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
          <ListItemText primary={t.upload} />
        </StyledMenuItem>
        <StyledMenuItem id="referenceResource" onClick={handle('reference')}>
          <ListItemText primary={t.sharedResource} />
        </StyledMenuItem>
        {/* <StyledMenuItem id="activity" onClick={handle('activity')}>
          <ListItemText primary={t.activity} />
        </StyledMenuItem> */}
      </StyledMenu>
    </div>
  );
};

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'passageDetailArtifacts' }),
});

export default connect(mapStateToProps)(AddResource) as any as any;
