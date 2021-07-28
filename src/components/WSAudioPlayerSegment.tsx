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
import { IWsAudioPlayerStrings } from '../model';
import { FaGripLinesVertical } from 'react-icons/fa';
import ClearIcon from '@material-ui/icons/Clear';
import SettingsIcon from '@material-ui/icons/Settings';
import BigDialog, { BigDialogBp } from '../hoc/BigDialog';
import { HotKeyContext } from '../context/HotKeyContext';
import PlusMinusLogo from '../control/PlusMinus';

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
  wsRemoveSplitRegion: (next?: boolean) => void;
  wsAddOrRemoveRegion: () => void;
}

export function WSAudioPlayerSegment(props: IProps) {
  const classes = useStyles();
  const { t, ready, wsAutoSegment, wsRemoveSplitRegion, wsAddOrRemoveRegion } =
    props;
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
    wsAutoSegment(silenceValue / 1000, timeValue / 100);
    return true;
  };
  const handleShowSettings = () => {
    setShowSettings(!showSettings);
  };
  const handleSplit = () => {
    wsAddOrRemoveRegion();
    return true;
  };
  const handleRemoveNextSplit = () => {
    wsRemoveSplitRegion(true);
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

  const t2 = {
    AutoSegment: 'Segment {0}',
    SegmentSettings: 'Segment parameters',
    SilenceThreshold: 'Silence threshold',
    SilenceLength: 'Length of Silence (100ths of second)',
    SplitSegment: 'Add/Remove Split {0}',
    RemoveSegment: 'Remove Next Split {0}',
  };
  return (
    <div className={classes.root}>
      <Grid container className={classes.toolbar}>
        <Grid item>
          <LightTooltip
            id="wsSegmentTip"
            title={t2.AutoSegment.replace('{0}', '')}
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
          <LightTooltip id="wsSettingsTip" title={t2.SegmentSettings}>
            <span>
              <IconButton id="wsSegmentSettings" onClick={handleShowSettings}>
                <SettingsIcon fontSize="small" />
              </IconButton>
            </span>
          </LightTooltip>

          {showSettings && (
            <BigDialog
              title={t2.SegmentSettings}
              isOpen={showSettings}
              onOpen={setShowSettings}
              bp={BigDialogBp.md}
            >
              <Box display="flex" flexDirection="column">
                <Typography id="silence-slider-label" gutterBottom>
                  {t2.SilenceThreshold}
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
                  {t2.SilenceLength}
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
            title={t2.SplitSegment.replace(
              '{0}',
              localizeHotKey(ADDREMSEG_KEY)
            )}
          >
            <span>
              <IconButton id="wsSplit" onClick={handleSplit}>
                <PlusMinusLogo disabled={!ready} />
              </IconButton>
            </span>
          </LightTooltip>
          <LightTooltip
            id="wsJoinTip"
            title={t2.RemoveSegment.replace('{0}', localizeHotKey(DELREG_KEY))}
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
