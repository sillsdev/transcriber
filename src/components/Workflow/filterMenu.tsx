import React, { useMemo, useState } from 'react';
import { IScriptureTableFilterStrings, OrgWorkflowStep } from '../../model';
import {
  IconButton,
  ListItemIcon,
  ListItemText,
  Badge,
  FormControlLabel,
  Checkbox,
  Divider,
  TextField,
  Box,
  Typography,
} from '@mui/material';
import FilterIcon from '@mui/icons-material/FilterList';
import BoxOpen from '@mui/icons-material/CheckBoxOutlineBlank';
import BoxClose from '@mui/icons-material/CheckBox';
import { iconMargin, StyledMenu, StyledMenuItem } from '../../control';
import { scriptureTableFilterMenuSelector } from '../../selector';
import { shallowEqual, useSelector } from 'react-redux';
import { OrgWorkflowStepList } from './OrgWorkflowStepList';
import { useOrganizedBy } from '../../crud';

export interface ISTFilterState {
  minStep: string; //orgworkflow step to show this step or after
  maxStep: string; //orgworkflow step to show this step or before
  minSection: number;
  maxSection: number;
  assignedToMe: boolean;
  hideDone: boolean;
}

interface IProps {
  state: ISTFilterState;
  canSetDefault: boolean;
  orgSteps: OrgWorkflowStep[];
  maximumSection: number;
  onFilterChange: (newstate: ISTFilterState, isDefault: boolean) => void;
  stopPlayer?: () => void;
  disabled?: boolean;
}

export function FilterMenu(props: IProps) {
  const {
    orgSteps,
    canSetDefault,
    maximumSection,
    onFilterChange,
    stopPlayer,
    disabled,
  } = props;
  const { minStep, maxStep, hideDone, minSection, maxSection, assignedToMe } =
    props.state;
  const [isDefault, setIsDefault] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const t: IScriptureTableFilterStrings = useSelector(
    scriptureTableFilterMenuSelector,
    shallowEqual
  );
  const { getOrganizedBy } = useOrganizedBy();
  const [organizedBy] = useState(getOrganizedBy(true));

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    if (anchorEl) setAnchorEl(null);
    else setAnchorEl(event.currentTarget);
    if (stopPlayer) stopPlayer();
  };

  const filterChange = (what: string, value: any) => {
    var newstate = { ...props.state } as any;
    newstate[what] = value;
    onFilterChange(newstate, isDefault);
  };
  const handleBool = (what: string) => (e: React.MouseEvent) => {
    e.stopPropagation();
    // setAnchorEl(null);
    filterChange(what, !Boolean((props.state as any)[what] ?? true));
  };
  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAnchorEl(null);
  };
  const handle = (what: string, value: string) => {
    filterChange(what, value);
  };
  const handleNumberChange = (what: string) => (e: any) => {
    e.stopPropagation();
    filterChange(what, parseInt(e.target.value));
  };

  const handleDefaultCheck = (value: boolean) => {
    setIsDefault(value);
    if (value) onFilterChange({ ...props.state }, value);
    setAnchorEl(null);
  };

  const anyFilter = useMemo(
    () =>
      minStep !== '' ||
      maxStep !== '' ||
      hideDone ||
      minSection > 0 ||
      maxSection > 0 ||
      assignedToMe,

    [minStep, maxStep, hideDone, minSection, maxSection, assignedToMe]
  );

  return (
    <Badge
      badgeContent={anyFilter ? ' ' : 0}
      overlap="circular"
      variant="dot"
      color="secondary"
    >
      <IconButton
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
        onClose={handleClose}
      >
        <StyledMenuItem id="for-me-filt" onClick={handleBool('assignedToMe')}>
          <ListItemIcon>
            {assignedToMe ? <BoxClose id="yesme" /> : <BoxOpen id="nome" />}
          </ListItemIcon>
          <ListItemText primary={t.assignedToMe} />
        </StyledMenuItem>
        <StyledMenuItem id="done-filt" onClick={handleBool('hideDone')}>
          <ListItemIcon>
            {hideDone ? <BoxClose id="yesdone" /> : <BoxOpen id="nodone" />}
          </ListItemIcon>
          <ListItemText primary={t.hideDone} />
        </StyledMenuItem>
        <Box sx={{ mx: 1 }}>
          <Typography gutterBottom>{t.step}</Typography>
          <OrgWorkflowStepList
            label={t.minimum}
            defaultChoice={minStep}
            stepData={orgSteps}
            onStepFilter={(chosen: string) => handle('minStep', chosen)}
          />
          <OrgWorkflowStepList
            label={t.maximum}
            defaultChoice={maxStep}
            stepData={orgSteps}
            onStepFilter={(chosen: string) => handle('maxStep', chosen)}
          />
        </Box>
        {maximumSection > 0 && (
          <Box sx={{ mx: 1, my: 1 }}>
            <Typography gutterBottom>{organizedBy}</Typography>
            <TextField
              sx={{ minWidth: '80px', mx: 1 }}
              name="minSection"
              label={t.minimum}
              type="number"
              value={minSection}
              InputProps={{ inputProps: { min: 1, max: maximumSection } }}
              onChange={handleNumberChange('minSection')}
            />
            <TextField
              sx={{ minWidth: '80px', mx: 1 }}
              name="maxSection"
              label={t.maximum}
              type="number"
              value={maxSection > 0 ? maxSection : maximumSection}
              InputProps={{
                inputProps: { min: minSection, max: maximumSection },
              }}
              onChange={handleNumberChange('maxSection')}
            />
          </Box>
        )}

        <Divider />
        {canSetDefault && (
          <FormControlLabel
            control={
              <Checkbox
                sx={iconMargin}
                checked={isDefault}
                onChange={(event) => handleDefaultCheck(event.target.checked)}
                value="projDefault"
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
