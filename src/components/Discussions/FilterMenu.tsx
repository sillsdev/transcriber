import React, { useMemo } from 'react';
import { IFilterMenuStrings } from '../../model';
import {
  IconButton,
  ListItemIcon,
  ListItemText,
  Badge,
  Checkbox,
  Divider,
  FormControlLabel,
} from '@mui/material';
import FilterIcon from '@mui/icons-material/FilterList';
import BoxOpen from '@mui/icons-material/CheckBoxOutlineBlank';
import BoxClose from '@mui/icons-material/CheckBox';
import { StyledMenu, StyledMenuItem } from '../../control';
import { filterMenuSelector } from '../../selector';
import { shallowEqual, useSelector } from 'react-redux';

export enum Resolved {
  No,
  Yes,
  Both,
}

export interface IFilterState {
  forYou: boolean;
  resolved: Resolved;
  latestVersion: boolean;
  allPassages: boolean;
  allSteps: boolean;
  [key: string]: boolean | Resolved;
}

interface IProps {
  state: IFilterState;
  action?: (what: string) => void;
  cats: number;
  stopPlayer?: () => void;
  disabled?: boolean;
  teamDefault: boolean;
  setTeamDefault?: (td: boolean) => void;
}

export function FilterMenu(props: IProps) {
  const { action, cats, stopPlayer, disabled, teamDefault, setTeamDefault } =
    props;
  const { forYou, resolved, latestVersion, allPassages, allSteps } =
    props.state;
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const t: IFilterMenuStrings = useSelector(filterMenuSelector, shallowEqual);

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
  const anyFilter = useMemo(
    () =>
      forYou ||
      resolved !== Resolved.No ||
      latestVersion ||
      allPassages ||
      allSteps ||
      cats > 0,
    [forYou, resolved, latestVersion, allPassages, allSteps, cats]
  );

  return (
    <Badge
      badgeContent={anyFilter ? ' ' : 0}
      overlap="circular"
      variant="dot"
      color="secondary"
    >
      <IconButton
        title={t.filter}
        id="filterMenu"
        aria-controls="filter-menu"
        aria-haspopup="true"
        sx={{ color: 'primary.light' }}
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
            {resolved === Resolved.Both ? (
              t.all
            ) : resolved === Resolved.Yes ? (
              <BoxClose id="yesres" />
            ) : (
              <BoxOpen id="nores" />
            )}
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
        {setTeamDefault && <Divider component="li" />}
        {setTeamDefault && (
          <FormControlLabel
            sx={{ ml: 1 }}
            control={
              <Checkbox
                checked={teamDefault}
                disableRipple
                inputProps={{ 'aria-labelledby': 'save as team default' }}
                onChange={(event) => setTeamDefault(event.target.checked)}
              />
            }
            label={t.saveFilter}
          />
        )}
      </StyledMenu>
    </Badge>
  );
}

export default FilterMenu;
