import React, { useRef, useState, useEffect, useContext } from 'react';
import { IScriptureTableFilterStrings, OrgWorkflowStep } from '../../model';
import {
  IconButton,
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
import { iconMargin, PriButton, StyledMenu } from '../../control';
import { scriptureTableFilterMenuSelector } from '../../selector';
import { shallowEqual, useSelector } from 'react-redux';
import { OrgWorkflowStepList } from './OrgWorkflowStepList';
import { useOrganizedBy } from '../../crud';
import { PlanContext } from '../../context/PlanContext';

export interface ISTFilterState {
  minStep: string; //orgworkflow step to show this step or after
  maxStep: string; //orgworkflow step to show this step or before
  minSection: number;
  maxSection: number;
  assignedToMe: boolean;
  hideDone: boolean;
  disabled: boolean;
  canHideDone: boolean;
}
const btnProp = { m: 1 } as SxProps;
interface IProps {
  state: ISTFilterState;
  canSetDefault: boolean;
  orgSteps: OrgWorkflowStep[];
  minimumSection: number;
  maximumSection: number;
  hidePublishing: boolean;
  onFilterChange: (
    newstate: ISTFilterState | undefined,
    isDefault: boolean
  ) => void;
  filtered: boolean;
  setBusy?: (value: boolean) => void;
  disabled?: boolean;
}

export function FilterMenu(props: IProps) {
  const {
    orgSteps,
    canSetDefault,
    minimumSection,
    maximumSection,
    onFilterChange,
    filtered,
    hidePublishing,
    setBusy,
    disabled
  } = props;
  const [localState, setLocalState] = useState(props.state);
  const [isDefault, setIsDefault] = useState(false);
  const defaultRef = useRef(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { sectionArr } = useContext(PlanContext).state;
  const sectionMap = new Map<number, string>(sectionArr);
  const [mapMin, setMapMin] = useState(
    !hidePublishing ? sectionMap.get(localState.minSection) : ''
  );
  const [mapMax, setMapMax] = useState(
    !hidePublishing
      ? sectionMap.get(
        localState.maxSection > 0 ? localState.maxSection : maximumSection
      )
      : ''
  );
  const [minHelp, setMinHelp] = useState('');
  const [maxHelp, setMaxHelp] = useState('');
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

  const apply = (
    filterState: ISTFilterState | undefined,
    projDefault: boolean
  ) => {
    setApplying(true);
    onFilterChange(filterState, projDefault);
    setApplying(false);
    setChanged(false);
  };
  const handleApply = () => {
    apply(localState, defaultRef.current);
  };
  const handleClear = () => {
    apply(undefined, defaultRef.current);
    setAnchorEl(null);
    setMapMin(!hidePublishing ? sectionMap.get(minimumSection) : '');
    setMapMax(
      !hidePublishing
        ? sectionMap.get(
          localState.maxSection > 0 ? localState.maxSection : maximumSection
        )
        : ''
    );
    setMinHelp('');
    setMaxHelp('');
  };
  const handleDisabled = (event: React.ChangeEvent<HTMLInputElement>) => {
    apply({ ...localState, disabled: event.target.checked }, false);
  };
  useEffect(() => {
    setLocalState(props.state);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.state]);

  const filterChange = (what: string, value: any) => {
    var newstate = { ...localState } as any;
    newstate[what] = value;
    setLocalState(newstate);
    setChanged(true);
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLocalState(props.state);
    setAnchorEl(null);
  };
  const handle = (what: string, value: any) => {
    filterChange(what, value);
  };
  const handleNumberChange = (what: string) => (e: any) => {
    e.stopPropagation();
    filterChange(what, parseInt(e.target.value));
  };
  const getKeyValue = (value: string) => {
    let key = undefined;
    for (const [k, v] of Array.from(sectionMap.entries())) {
      if (v === value) {
        key = k;
        break;
      }
    }
    return key;
  };
  const handleMapChange = (what: string) => (e: any) => {
    e.stopPropagation();
    const value = getKeyValue(e.target.value);
    if (what === 'minSection') {
      setMapMin(e.target.value);
      setMinHelp(value ? '' : t.invalidSection);
    } else {
      setMapMax(e.target.value);
      setMaxHelp(value ? '' : t.invalidSection);
    }
    if (value) {
      filterChange(what, value);
    }
  };

  const handleDefaultCheck = (value: boolean) => {
    setIsDefault(value);
    defaultRef.current = value;
    setChanged(true);
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
        <Box sx={{ display: 'inline-flex', flexDirection: 'column' }}>
          <FormControlLabel
            control={
              <Checkbox
                id="assignedToMe"
                sx={iconMargin}
                checked={localState.assignedToMe}
                onChange={(event) =>
                  handle('assignedToMe', event.target.checked)
                }
              />
            }
            label={t.assignedToMe}
          />
          {localState.canHideDone && (
            <FormControlLabel
              control={
                <Checkbox
                  id="donefilter"
                  sx={iconMargin}
                  checked={localState.hideDone}
                  onChange={(event) => handle('hideDone', event.target.checked)}
                />
              }
              label={t.hideDone}
            />
          )}
        </Box>
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
        {maximumSection > 0 && hidePublishing && (
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
        {maximumSection > 0 && !hidePublishing && (
          <Box sx={{ mx: 1, my: 1 }}>
            <Typography gutterBottom>{organizedBy}</Typography>
            <TextField
              sx={{ minWidth: '80px', mx: 1 }}
              name="minSection"
              label={t.minimum}
              value={mapMin || sectionMap.get(localState.minSection) || ''}
              helperText={minHelp}
              onChange={handleMapChange('minSection')}
            />
            <TextField
              sx={{ minWidth: '80px', mx: 1 }}
              name="maxSection"
              label={t.maximum}
              value={
                mapMax ||
                sectionMap.get(
                  localState.maxSection > 0
                    ? localState.maxSection
                    : maximumSection
                ) ||
                ''
              }
              helperText={maxHelp}
              onChange={handleMapChange('maxSection')}
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
                  sx={{ mx: 1 }}
                  checked={localState.disabled}
                  onChange={handleDisabled}
                  disabled={!filtered && !localState.disabled}
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
          disabled={
            applyingRef.current ||
            !changed ||
            Boolean(minHelp) ||
            Boolean(maxHelp)
          }
        >
          {t.apply}
        </PriButton>
      </StyledMenu>
    </Badge>
  );
}

export default FilterMenu;
