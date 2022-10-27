import {
  Box,
  Typography,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  SxProps,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { useEffect, useMemo, useRef, useState } from 'react';
import { IWsAudioPlayerSegmentStrings, RoleNames } from '../model';
import CloseIcon from '@mui/icons-material/Close';
import Paper from '@mui/material/Paper';
import Draggable from 'react-draggable';
import { IRegionParams } from '../crud/useWavesurferRegions';
import { AltButton, GrowingSpacer, IosSlider, PriButton } from '../control';
import { wsAudioPlayerSegmentSelector } from '../selector';
import { shallowEqual, useSelector } from 'react-redux';
import { useGlobal } from 'reactn';

const btnProp = { m: 1 } as SxProps;
const rowProp = { display: 'flex' } as SxProps;
const colProp = { display: 'flex', flexDirection: 'column' } as SxProps;

interface IProps {
  loop: boolean;
  params: IRegionParams;
  currentNumRegions: number;
  wsAutoSegment: (loop: boolean, params: IRegionParams) => number;
  isOpen: boolean;
  onOpen: (isOpen: boolean) => void;
  onSave: (params: IRegionParams, teamDefault: boolean) => void;
  setBusy?: (value: boolean) => void;
}

function WSSegmentParameters(props: IProps) {
  const {
    loop,
    params,
    currentNumRegions,
    wsAutoSegment,
    isOpen,
    onOpen,
    onSave,
    setBusy,
  } = props;
  const [orgRole] = useGlobal('orgRole');
  const [silenceValue, setSilenceValue] = useState(0);
  const [timeValue, setTimeValue] = useState(0);
  const [segLength, setSegmentLen] = useState(0);
  const [numRegions, setNumRegions] = useState(currentNumRegions);
  const [teamDefault, setTeamDefault] = useState(false);
  const applyingRef = useRef(false);
  const t: IWsAudioPlayerSegmentStrings = useSelector(
    wsAudioPlayerSegmentSelector,
    shallowEqual
  );

  const isAdmin = useMemo(() => orgRole === RoleNames.Admin, [orgRole]);

  useEffect(() => {
    setNumRegions(currentNumRegions);
  }, [currentNumRegions]);

  useEffect(() => {
    setSilenceValue(params.silenceThreshold * 1000);
    setTimeValue(params.timeThreshold * 100);
    setSegmentLen(params.segLenThreshold);
  }, [params]);

  const handleSilenceChange = (event: Event, value: number | number[]) => {
    if (Array.isArray(value)) value = value[0];
    setSilenceValue(value);
  };
  const handleTimeChange = (event: Event, value: number | number[]) => {
    if (Array.isArray(value)) value = value[0];
    setTimeValue(value);
  };
  const handleSegTimeChange = (event: Event, value: number | number[]) => {
    if (Array.isArray(value)) value = value[0];
    setSegmentLen(value);
  };
  const setApplying = (value: boolean) => {
    applyingRef.current = value;
    if (setBusy) setBusy(value);
  };
  const handleApply = () => {
    setApplying(true);
    const params = {
      silenceThreshold: silenceValue / 1000,
      timeThreshold: timeValue / 100,
      segLenThreshold: segLength,
    };
    setNumRegions(wsAutoSegment(loop, params));
    onSave(params, teamDefault);
    setApplying(false);
  };

  const handleClose = () => {
    if (onOpen) onOpen(false);
  };

  function PaperComponent(props: any) {
    return (
      <Draggable
        handle="#draggable-dialog-title"
        cancel={'[class*="MuiDialogContent-root"]'}
      >
        <Paper {...props} />
      </Draggable>
    );
  }
  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      PaperComponent={PaperComponent}
      aria-labelledby="draggable-dialog-title"
      disableEnforceFocus
    >
      <DialogTitle sx={{ cursor: 'move' }} id="draggable-dialog-title">
        <Box sx={rowProp}>
          <GrowingSpacer />
          <IconButton
            id="bigClose"
            onClick={handleClose}
            disabled={applyingRef.current}
          >
            <CloseIcon />
          </IconButton>
        </Box>
        <Box sx={rowProp}>
          <Box sx={colProp}>{t.segmentSettings}</Box>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={colProp}>
          <Typography id="silence-slider-label" gutterBottom>
            {t.silenceThreshold}
          </Typography>
          <IosSlider
            id="loudnessslider"
            sx={{ width: 'unset' }}
            min={1}
            max={50}
            step={1}
            marks
            value={silenceValue || 1}
            valueLabelDisplay="auto"
            onChange={handleSilenceChange}
            aria-labelledby="silence-slider"
          />
          <Typography id="silence-slider-label" gutterBottom>
            {t.silenceLength}
          </Typography>
          <IosSlider
            id="silenceLenSlider"
            sx={{ width: 'unset' }}
            step={1}
            marks
            min={1}
            max={20}
            value={timeValue || 1}
            valueLabelDisplay="auto"
            onChange={handleTimeChange}
            aria-labelledby="time-slider"
          />
          <Typography id="segment-slider-label" gutterBottom>
            {t.segmentLength}
          </Typography>
          <IosSlider
            id="segmentLengthSlider"
            sx={{ width: 'unset' }}
            step={0.5}
            marks
            min={0.5}
            max={8}
            value={segLength || 0.5}
            valueLabelDisplay="auto"
            onChange={handleSegTimeChange}
            aria-labelledby="time-slider"
          />
          <Typography id="num-label" gutterBottom>
            {numRegions !== undefined
              ? t.segmentNumber.replace('{0}', numRegions.toString())
              : ''}
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <PriButton
          autoFocus
          sx={btnProp}
          onClick={handleApply}
          disabled={applyingRef.current}
        >
          {t.apply}
        </PriButton>
        <AltButton
          sx={btnProp}
          onClick={handleClose}
          disabled={applyingRef.current}
        >
          {t.close}
        </AltButton>
        {isAdmin && (
          <FormControlLabel
            control={
              <Checkbox
                checked={teamDefault}
                onChange={(event) => setTeamDefault(event.target.checked)}
                value="teamDefault"
              />
            }
            label={'xTeam Default'}
          />
        )}
      </DialogActions>
    </Dialog>
  );
}

export default WSSegmentParameters;
