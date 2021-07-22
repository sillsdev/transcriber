import {
  makeStyles,
  Theme,
  createStyles,
  IconButton,
  Grid,
  Slider,
  Box,
  Typography,
} from '@material-ui/core';
import React, { ChangeEvent, useState } from 'react';
import { LightTooltip } from '../control';
import { IWsAudioPlayerStrings } from '../model';
import { FaGripLinesVertical, FaHandScissors } from 'react-icons/fa';
import ClearIcon from '@material-ui/icons/Clear';
import SettingsIcon from '@material-ui/icons/Settings';

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
    toolbar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyItems: 'flex-start',
      display: 'flex',
    },
    togglebutton: {
      marginLeft: theme.spacing(1),
      marginRight: theme.spacing(1),
    },
    formControl: {
      margin: theme.spacing(1),
      maxWidth: 50,
    },
    rotate90: { rotate: '90' },
  })
);

interface IProps {
  t: IWsAudioPlayerStrings;
  ready: boolean;
  wsAutoSegment: (silenceThreshold?: number, timeThreshold?: number) => void;
  wsSplitRegion: () => void;
  wsRemoveSplitRegion: () => void;
  wsAddOrRemoveRegion: () => void;
}
export function WSAudioPlayerSegment(props: IProps) {
  const classes = useStyles();
  const { t, ready, wsAutoSegment, wsRemoveSplitRegion, wsAddOrRemoveRegion } =
    props;
  const [silenceValue, setSilenceValue] = useState(4);
  const [timeValue, setTimeValue] = useState(2);
  const [showSettings, setShowSettings] = useState(false);
  const handleAutoSegment = () => {
    wsAutoSegment(silenceValue / 1000, timeValue / 100);
  };
  const handleShowSettings = () => {
    setShowSettings(!showSettings);
  };
  const handleSplit = () => {
    wsAddOrRemoveRegion();
  };
  const handleRemoveSplit = () => {
    wsRemoveSplitRegion();
  };
  const handleSilenceChange = (
    event: ChangeEvent<{}>,
    value: number | number[]
  ) => {
    if (Array.isArray(value)) value = value[0];
    console.log(value);
    setSilenceValue(value);
  };
  const handleTimeChange = (
    event: ChangeEvent<{}>,
    value: number | number[]
  ) => {
    if (Array.isArray(value)) value = value[0];
    setTimeValue(value);
  };
  return (
    <div className={classes.root}>
      <Grid container className={classes.toolbar}>
        <Grid item>
          <LightTooltip id="wsSegmentTip" title={'TODO:Segment'}>
            <span>
              <IconButton
                id="wsSegment"
                onClick={handleAutoSegment}
                disabled={!ready}
              >
                <FaGripLinesVertical className={classes.rotate90} />
              </IconButton>
            </span>
          </LightTooltip>
          <LightTooltip id="wsSettingsTip" title={'TODO:Segment parameters'}>
            <span>
              <IconButton id="wsSegmentSettings" onClick={handleShowSettings}>
                <SettingsIcon fontSize="small" />
              </IconButton>
            </span>
          </LightTooltip>

          {showSettings && (
            <Box display="flex" flexDirection="column">
              <Typography id="silence-slider-label" gutterBottom>
                Silence threshold (1000ths)
              </Typography>
              <Slider
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
                Length of Silence threshold (100ths of second)
              </Typography>
              <Slider
                step={1}
                marks
                min={1}
                max={10}
                value={timeValue}
                valueLabelDisplay="auto"
                onChange={handleTimeChange}
                aria-labelledby="time-slider"
              />
            </Box>
          )}
          <LightTooltip id="wsSplitTip" title={'todo:SplitSegment'}>
            <span>
              <IconButton id="wsSplit" onClick={handleSplit}>
                <FaHandScissors />
              </IconButton>
            </span>
          </LightTooltip>
          <LightTooltip id="wsJoinTip" title={'todo:Remove Break'}>
            <span>
              <IconButton id="wsJoin" onClick={handleRemoveSplit}>
                <ClearIcon />
              </IconButton>
            </span>
          </LightTooltip>
        </Grid>
      </Grid>
    </div>
  );
}
