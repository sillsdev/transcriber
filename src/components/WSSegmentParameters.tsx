import {
  makeStyles,
  Theme,
  createStyles,
  Slider,
  Box,
  Typography,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
} from '@material-ui/core';
import React, { ChangeEvent, useEffect, useState } from 'react';
import { IWsAudioPlayerSegmentStrings, IState } from '../model';
import { connect } from 'react-redux';
import localStrings from '../selector/localize';
import CloseIcon from '@material-ui/icons/Close';
import Paper from '@material-ui/core/Paper';
import Draggable from 'react-draggable';
import { IRegionParams } from '../crud/useWavesurferRegions';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      flexGrow: 1,
    },
    main: {
      display: 'flex',
      flexDirection: 'column',
      whiteSpace: 'nowrap',
    },
    button: { margin: theme.spacing(1) },
    row: {
      display: 'flex',
    },
    column: {
      display: 'flex',
      flexDirection: 'column',
    },
    grow: {
      flexGrow: 1,
    },
  })
);
interface IStateProps {
  t: IWsAudioPlayerSegmentStrings;
}
interface IProps extends IStateProps {
  loop: boolean;
  params: IRegionParams;
  currentNumRegions: number;
  wsAutoSegment: (loop: boolean, params: IRegionParams) => number;
  isOpen: boolean;
  onOpen: (isOpen: boolean) => void;
  onSave: (silence: number, silenceLen: number, segmentLen: number) => void;
}

function WSSegmentParameters(props: IProps) {
  const classes = useStyles();
  const {
    t,
    loop,
    params,
    currentNumRegions,
    wsAutoSegment,
    isOpen,
    onOpen,
    onSave,
  } = props;
  const [silenceValue, setSilenceValue] = useState(0);
  const [timeValue, setTimeValue] = useState(0);
  const [segLength, setSegmentLen] = useState(0);
  const [numRegions, setNumRegions] = useState(currentNumRegions);

  useEffect(() => {
    setSilenceValue(params.silenceThreshold * 1000);
    setTimeValue(params.timeThreshold * 100);
    setSegmentLen(params.segLenThreshold);
  }, [params]);

  const handleSilenceChange = (
    event: ChangeEvent<{}>,
    value: number | number[]
  ) => {
    if (Array.isArray(value)) value = value[0];
    setSilenceValue(value);
  };
  const handleTimeChange = (
    event: ChangeEvent<{}>,
    value: number | number[]
  ) => {
    if (Array.isArray(value)) value = value[0];
    setTimeValue(value);
  };
  const handleSegTimeChange = (
    event: ChangeEvent<{}>,
    value: number | number[]
  ) => {
    if (Array.isArray(value)) value = value[0];
    setSegmentLen(value);
  };
  const handleApply = () => {
    setNumRegions(
      wsAutoSegment(loop, {
        silenceThreshold: silenceValue / 1000,
        timeThreshold: timeValue / 100,
        segLenThreshold: segLength,
      })
    );
    onSave(silenceValue / 1000, timeValue / 100, segLength);
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
    >
      <DialogTitle style={{ cursor: 'move' }} id="draggable-dialog-title">
        <div className={classes.row}>
          <div className={classes.grow}>{'\u00A0'}</div>{' '}
          <IconButton id="bigClose" onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </div>
        <div className={classes.row}>
          <div className={classes.column}>{t.segmentSettings}</div>
        </div>
      </DialogTitle>
      <DialogContent>
        <Box display="flex" flexDirection="column">
          <Typography id="silence-slider-label" gutterBottom>
            {t.silenceThreshold}
          </Typography>
          <Slider
            id="loudnessslider"
            min={1}
            max={50}
            step={1}
            marks
            value={silenceValue}
            valueLabelDisplay="auto"
            onChange={handleSilenceChange}
            aria-labelledby="silence-slider"
          />
          <Typography id="silence-slider-label" gutterBottom>
            {t.silenceLength}
          </Typography>
          <Slider
            id="silenceLenSlider"
            step={1}
            marks
            min={1}
            max={10}
            value={timeValue}
            valueLabelDisplay="auto"
            onChange={handleTimeChange}
            aria-labelledby="time-slider"
          />
          <Typography id="segment-slider-label" gutterBottom>
            {t.segmentLength}
          </Typography>
          <Slider
            id="segmentLengthSlider"
            step={0.5}
            marks
            min={0.5}
            max={5}
            value={segLength}
            valueLabelDisplay="auto"
            onChange={handleSegTimeChange}
            aria-labelledby="time-slider"
          />
          <Typography id="num-label" gutterBottom>
            {numRegions !== undefined ? `${numRegions} regions` : ''}
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button
          autoFocus
          className={classes.button}
          onClick={handleApply}
          variant="outlined"
        >
          {t.apply}
        </Button>
        <Button
          className={classes.button}
          onClick={handleClose}
          variant="outlined"
        >
          {t.close}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'wsAudioPlayerSegment' }),
});

export default connect(mapStateToProps)(WSSegmentParameters) as any;
