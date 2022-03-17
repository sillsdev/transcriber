import React from 'react';
import { connect } from 'react-redux';
import { IState, IFilterMenuStrings } from '../../model';
import localStrings from '../../selector/localize';
import { withStyles } from '@material-ui/core/styles';
import { MenuProps } from '@material-ui/core/Menu';
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@material-ui/core';
import { makeStyles, createStyles, Theme } from '@material-ui/core';
import FilterIcon from '@material-ui/icons/FilterList';
import BoxOpen from '@material-ui/icons/CheckBoxOutlineBlank';
import BoxClose from '@material-ui/icons/CheckBox';

export interface IFilterState {
  forYou: boolean;
  resolved: boolean;
  latestVersion: boolean;
  allPassages: boolean;
  allSteps: boolean;
  [key: string]: boolean;
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    icon: {
      color: theme.palette.primary.light,
    },
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
      horizontal: 'right',
    }}
    transformOrigin={{
      vertical: 'top',
      horizontal: 'right',
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
  t: IFilterMenuStrings;
}

interface IProps extends IStateProps {
  state: IFilterState;
  action?: (what: string) => void;
  cats: number;
  stopPlayer?: () => void;
  disabled?: boolean;
}

export function FilterMenu(props: IProps) {
  const { action, cats, t, stopPlayer, disabled } = props;
  const { forYou, resolved, latestVersion, allPassages, allSteps } =
    props.state;
  const classes = useStyles();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
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
      <IconButton
        id="filterMenu"
        aria-controls="filter-menu"
        aria-haspopup="true"
        className={classes.icon}
        onClick={handleClick}
        disabled={disabled}
      >
        <FilterIcon />
      </IconButton>
      <StyledMenu
        id="filter-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handle('Close')}
      >
        <StyledMenuItem id="for-you-filt" onClick={handle('forYou')}>
          <ListItemIcon>
            {forYou ? <BoxClose id="yesyou" /> : <BoxOpen id="noyou" />}
          </ListItemIcon>
          <ListItemText primary={t.forYou} />
        </StyledMenuItem>
        <StyledMenuItem id="resolved-filt" onClick={handle('resolved')}>
          <ListItemIcon>
            {resolved ? <BoxClose id="yesres" /> : <BoxOpen id="nores" />}
          </ListItemIcon>
          <ListItemText primary={t.resolved} />
        </StyledMenuItem>
        <StyledMenuItem id="latest-filt" onClick={handle('latestVersion')}>
          <ListItemIcon>
            {latestVersion ? <BoxClose id="yeslat" /> : <BoxOpen id="nolat" />}
          </ListItemIcon>
          <ListItemText primary={t.latestVersion} />
        </StyledMenuItem>
        <StyledMenuItem id="all-pass-filt" onClick={handle('allPassages')}>
          <ListItemIcon>
            {allPassages ? <BoxClose id="yespass" /> : <BoxOpen id="nopass" />}
          </ListItemIcon>
          <ListItemText primary={t.allPassages} />
        </StyledMenuItem>
        <StyledMenuItem id="all-steps-filt" onClick={handle('allSteps')}>
          <ListItemIcon>
            {allSteps ? <BoxClose id="yesstep" /> : <BoxOpen id="nostep" />}
          </ListItemIcon>
          <ListItemText primary={t.allSteps} />
        </StyledMenuItem>
        <StyledMenuItem id="category-filt" onClick={handle('category')}>
          <ListItemIcon>{cats === 0 ? t.all : cats.toString()}</ListItemIcon>
          <ListItemText primary={t.category} />
        </StyledMenuItem>
      </StyledMenu>
    </>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'filterMenu' }),
});

export default connect(mapStateToProps)(FilterMenu) as any;
