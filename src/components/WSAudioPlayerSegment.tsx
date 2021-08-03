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
import React, { ChangeEvent, useContext, useEffect, useState } from 'react';
import { LightTooltip } from '../control';
import { IWsAudioPlayerSegmentStrings, IState } from '../model';
import { FaGripLinesVertical } from 'react-icons/fa';
import ClearIcon from '@material-ui/icons/Clear';
import SettingsIcon from '@material-ui/icons/Settings';
import BigDialog, { BigDialogBp } from '../hoc/BigDialog';
import { HotKeyContext } from '../context/HotKeyContext';
import PlusMinusLogo from '../control/PlusMinus';
import { IRegionChange } from '../crud/useWavesurferRegions';
import { useGlobal } from 'reactn';
import { connect } from 'react-redux';
import localStrings from '../selector/localize';

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
interface IStateProps {
  t: IWsAudioPlayerSegmentStrings;
}
interface IProps extends IStateProps {
  ready: boolean;
  loop: boolean;
  onSplit: (split: IRegionChange) => void;
  wsAutoSegment: (
    loop: boolean,
    silenceThreshold?: number,
    timeThreshold?: number
  ) => void;
  wsRemoveSplitRegion: (next?: boolean) => IRegionChange | undefined;
  wsAddOrRemoveRegion: () => IRegionChange | undefined;
}

function WSAudioPlayerSegment(props: IProps) {
  const classes = useStyles();
  const {
    t,
    ready,
    loop,
    onSplit,
    wsAutoSegment,
    wsRemoveSplitRegion,
    wsAddOrRemoveRegion,
  } = props;
  const [, setBusy] = useGlobal('importexportBusy');

  const [silenceValue, setSilenceValue] = useState(4);
  const [timeValue, setTimeValue] = useState(2);
  const [showSettings, setShowSettings] = useState(false);
  const { subscribe, unsubscribe, localizeHotKey } =
    useContext(HotKeyContext).state;

  const DELREG_KEY = 'CTRL+ALT+X';
  const ADDREMSEG_KEY = 'CTRL+ARROWDOWN';

  useEffect(() => {
    const keys = [
      { key: ADDREMSEG_KEY, cb: handleSplit },
      { key: DELREG_KEY, cb: handleRemoveNextSplit },
    ];
    keys.forEach((k) => subscribe(k.key, k.cb));

    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      keys.forEach((k) => unsubscribe(k.key));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const handleAutoSegment = () => {
    setBusy(true);
    wsAutoSegment(loop, silenceValue / 1000, timeValue / 100);
    setBusy(false);
    return true;
  };
  const handleShowSettings = () => {
    setShowSettings(!showSettings);
  };
  const handleSplit = () => {
    var result = wsAddOrRemoveRegion();
    if (result && onSplit) onSplit(result);
    return true;
  };
  const handleRemoveNextSplit = () => {
    var result = wsRemoveSplitRegion(true);
    if (result && onSplit) onSplit(result);
    return true;
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
          <LightTooltip
            id="wsSegmentTip"
            title={t.autoSegment.replace('[{0}]', '')}
          >
            <span>
              <IconButton
                id="wsSegment"
                onClick={handleAutoSegment}
                disabled={!ready}
              >
                <FaGripLinesVertical />
              </IconButton>
            </span>
          </LightTooltip>
          <LightTooltip id="wsSettingsTip" title={t.segmentSettings}>
            <span>
              <IconButton id="wsSegmentSettings" onClick={handleShowSettings}>
                <SettingsIcon fontSize="small" />
              </IconButton>
            </span>
          </LightTooltip>

          {showSettings && (
            <BigDialog
              title={t.segmentSettings}
              isOpen={showSettings}
              onOpen={setShowSettings}
              bp={BigDialogBp.md}
            >
              <Box display="flex" flexDirection="column">
                <Typography id="silence-slider-label" gutterBottom>
                  {t.silenceThreshold}
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
                  {t.silenceLength}
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
            </BigDialog>
          )}
          <LightTooltip
            id="wsSplitTip"
            title={t.splitSegment.replace('{0}', localizeHotKey(ADDREMSEG_KEY))}
          >
            <span>
              <IconButton id="wsSplit" onClick={handleSplit}>
                <PlusMinusLogo disabled={!ready} />
              </IconButton>
            </span>
          </LightTooltip>
          <LightTooltip
            id="wsJoinTip"
            title={t.removeSegment.replace('{0}', localizeHotKey(DELREG_KEY))}
          >
            <span>
              <IconButton id="wsJoin" onClick={handleRemoveNextSplit}>
                <ClearIcon />
              </IconButton>
            </span>
          </LightTooltip>
        </Grid>
      </Grid>
    </div>
  );
}
const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'wsAudioPlayerSegment' }),
});

export default connect(mapStateToProps)(WSAudioPlayerSegment) as any;
