import {
  Box,
  Typography,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  SxProps,
} from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { IWsAudioPlayerSegmentStrings } from '../model';
import CloseIcon from '@mui/icons-material/Close';
import Paper from '@mui/material/Paper';
import Draggable from 'react-draggable';
import { IRegionParams } from '../crud/useWavesurferRegions';
import { AltButton, GrowingSpacer, IosSlider, PriButton } from '../control';
import { wsAudioPlayerSegmentSelector } from '../selector';
import { shallowEqual, useSelector } from 'react-redux';

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
  onSave: (silence: number, silenceLen: number, segmentLen: number) => void;
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
  const [silenceValue, setSilenceValue] = useState(0);
  const [timeValue, setTimeValue] = useState(0);
  const [segLength, setSegmentLen] = useState(0);
  const [numRegions, setNumRegions] = useState(currentNumRegions);
  const applyingRef = useRef(false);
  const t: IWsAudioPlayerSegmentStrings = useSelector(
    wsAudioPlayerSegmentSelector,
    shallowEqual
  );

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
    setNumRegions(
      wsAutoSegment(loop, {
        silenceThreshold: silenceValue / 1000,
        timeThreshold: timeValue / 100,
        segLenThreshold: segLength,
      })
    );
    onSave(silenceValue / 1000, timeValue / 100, segLength);
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
      </DialogActions>
    </Dialog>
  );
}

export default WSSegmentParameters;
