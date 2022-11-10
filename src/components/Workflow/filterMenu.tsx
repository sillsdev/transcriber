import React, { useEffect, useRef, useState } from 'react';
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
  SxProps,
  Switch,
} from '@mui/material';
import FilterIcon from '@mui/icons-material/FilterList';
import BoxOpen from '@mui/icons-material/CheckBoxOutlineBlank';
import BoxClose from '@mui/icons-material/CheckBox';
import {
  iconMargin,
  PriButton,
  StyledMenu,
  StyledMenuItem,
} from '../../control';
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
  disabled: boolean;
}
const btnProp = { m: 1 } as SxProps;
interface IProps {
  state: ISTFilterState;
  canSetDefault: boolean;
  orgSteps: OrgWorkflowStep[];
  maximumSection: number;
  onFilterChange: (
    newstate: ISTFilterState | undefined,
    isDefault: boolean
  ) => void;
  filtered: boolean;
  setBusy?: (value: boolean) => void;
}

export function FilterMenu(props: IProps) {
  const {
    orgSteps,
    canSetDefault,
    maximumSection,
    onFilterChange,
    filtered,
    setBusy,
  } = props;
  const [localState, setLocalState] = useState(props.state);
  const [isDefault, setIsDefault] = useState(false);
  const defaultRef = useRef(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const t: IScriptureTableFilterStrings = useSelector(
    scriptureTableFilterMenuSelector,
    shallowEqual
  );
  const [changed, setChanged] = useState(false);

  const { getOrganizedBy } = useOrganizedBy();
  const [organizedBy] = useState(getOrganizedBy(true));
  const applyingRef = useRef(false);
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    if (anchorEl) setAnchorEl(null);
    else setAnchorEl(event.currentTarget);
  };

  const setApplying = (value: boolean) => {
    applyingRef.current = value;
    if (setBusy) setBusy(value);
  };

  const handleApply = () => {
    setApplying(true);
    onFilterChange(localState, defaultRef.current);
    setApplying(false);
    setChanged(false);
  };
  const handleClear = () => {
    setApplying(true);
    onFilterChange(undefined, defaultRef.current);
    setApplying(false);
    setChanged(false);
    setAnchorEl(null);
  };
  useEffect(() => {
    setLocalState(props.state);
  }, [props.state]);

  const filterChange = (what: string, value: any) => {
    var newstate = { ...localState } as any;
    newstate[what] = value;
    setLocalState(newstate);
    setChanged(true);
  };
  const handleBool = (what: string) => (e: React.MouseEvent) => {
    e.stopPropagation();
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
    defaultRef.current = value;
    setChanged(true);
  };
  const handleDisabled = (event: React.ChangeEvent<HTMLInputElement>) => {
    filterChange('disabled', event.target.checked);
  };

  return (
    <Badge
      badgeContent={filtered ? ' ' : 0}
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
            {localState.assignedToMe ? (
              <BoxClose id="yesme" />
            ) : (
              <BoxOpen id="nome" />
            )}
          </ListItemIcon>
          <ListItemText primary={t.assignedToMe} />
        </StyledMenuItem>
        <StyledMenuItem id="done-filt" onClick={handleBool('hideDone')}>
          <ListItemIcon>
            {localState.hideDone ? (
              <BoxClose id="yesdone" />
            ) : (
              <BoxOpen id="nodone" />
            )}
          </ListItemIcon>
          <ListItemText primary={t.hideDone} />
        </StyledMenuItem>
        <Box sx={{ mx: 1 }}>
          <Typography gutterBottom>{t.step}</Typography>
          <OrgWorkflowStepList
            label={t.minimum}
            defaultChoice={localState.minStep}
            stepData={orgSteps}
            onStepFilter={(chosen: string) => handle('minStep', chosen)}
          />
          <OrgWorkflowStepList
            label={t.maximum}
            defaultChoice={localState.maxStep}
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
              value={localState.minSection}
              InputProps={{ inputProps: { min: 1, max: maximumSection } }}
              onChange={handleNumberChange('minSection')}
            />
            <TextField
              sx={{ minWidth: '80px', mx: 1 }}
              name="maxSection"
              label={t.maximum}
              type="number"
              value={
                localState.maxSection > 0
                  ? localState.maxSection
                  : maximumSection
              }
              InputProps={{
                inputProps: { min: localState.minSection, max: maximumSection },
              }}
              onChange={handleNumberChange('maxSection')}
            />
          </Box>
        )}

        <Divider />
        {canSetDefault && (
          <Box sx={{ display: 'inline-flex', flexDirection: 'column' }}>
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
            <FormControlLabel
              control={
                <Switch
                  checked={localState.disabled}
                  onChange={handleDisabled}
                />
              }
              label={t.disable}
            />
          </Box>
        )}
        <PriButton
          autoFocus
          sx={btnProp}
          onClick={handleClear}
          disabled={applyingRef.current || !filtered}
        >
          {t.clear}
        </PriButton>
        <PriButton
          autoFocus
          sx={btnProp}
          onClick={handleApply}
          disabled={applyingRef.current || !changed}
        >
          {t.apply}
        </PriButton>
      </StyledMenu>
    </Badge>
  );
}

export default FilterMenu;
