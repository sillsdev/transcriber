import {
  makeStyles,
  Theme,
  createStyles,
  IconButton,
  Grid,
} from '@material-ui/core';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { LightTooltip } from '../control';
import { IWsAudioPlayerSegmentStrings, IState } from '../model';
import { IoMdBarcode } from 'react-icons/io';
import RemoveOneIcon from '@material-ui/icons/Clear';
import SettingsIcon from '@material-ui/icons/Settings';
import ClearIcon from '@material-ui/icons/Delete';
import { HotKeyContext } from '../context/HotKeyContext';
import PlusMinusLogo from '../control/PlusMinus';
import { IRegionChange, IRegionParams } from '../crud/useWavesurferRegions';
import { connect } from 'react-redux';
import localStrings from '../selector/localize';
import WSSegmentParameters from './WSSegmentParameters';
import { useSnackBar } from '../hoc/SnackBar';
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
    button: { margin: theme.spacing(1) },
  })
);
interface IStateProps {
  t: IWsAudioPlayerSegmentStrings;
}
interface IProps extends IStateProps {
  ready: boolean;
  loop: boolean;
  currentNumRegions: number;
  params: IRegionParams;
  playing: boolean;
  onSplit: (split: IRegionChange) => void;
  wsAutoSegment?: (loop: boolean, params: IRegionParams) => number;
  wsRemoveSplitRegion: (next?: boolean) => IRegionChange | undefined;
  wsAddOrRemoveRegion: () => IRegionChange | undefined;
  wsClearRegions: () => void;
  setBusy?: (value: boolean) => void;
}

function WSAudioPlayerSegment(props: IProps) {
  const classes = useStyles();
  const {
    t,
    ready,
    loop,
    currentNumRegions,
    params,
    playing,
    onSplit,
    wsAutoSegment,
    wsRemoveSplitRegion,
    wsAddOrRemoveRegion,
    wsClearRegions,
    setBusy,
  } = props;
  const [segParams, setSegParams] = useState<IRegionParams>({
    silenceThreshold: 0.004,
    timeThreshold: 0.02,
    segLenThreshold: 0.5,
  });
  const busyRef = useRef(false);
  const [showSettings, setShowSettings] = useState(false);
  const { subscribe, unsubscribe, localizeHotKey } =
    useContext(HotKeyContext).state;
  const { showMessage } = useSnackBar();
  const DELREG_KEY = 'CTRL+ALT+X';
  const ADDREMSEG_KEY = 'CTRL+ARROWDOWN';
  const readyRef = useRef(ready);

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

  useEffect(() => {
    readyRef.current = ready;
  }, [ready]);

  useEffect(() => {
    setSegParams({
      silenceThreshold: params?.silenceThreshold
        ? params.silenceThreshold
        : 0.004,
      timeThreshold: params?.timeThreshold ? params.timeThreshold : 0.02,
      segLenThreshold: params?.segLenThreshold || 0.5,
    });
  }, [params]);

  const setSegmenting = (value: boolean) => {
    if (setBusy) setBusy(value);
    busyRef.current = value;
  };
  const handleAutoSegment = () => {
    setSegmenting(true);
    var numRegions = (wsAutoSegment && wsAutoSegment(loop, segParams)) ?? 0;
    showMessage(t.segmentsCreated.replace('{0}', numRegions.toString()));
    setSegmenting(false);
    return true;
  };
  const handleShowSettings = () => {
    setShowSettings(!showSettings);
  };
  const handleSplit = () => {
    if (!readyRef.current) return false;
    if (setBusy) setBusy(true);
    var result = wsAddOrRemoveRegion();
    if (result && onSplit) onSplit(result);
    if (setBusy) setBusy(false);
    return true;
  };
  const handleRemoveNextSplit = () => {
    if (!readyRef.current) return false;
    if (setBusy) setBusy(true);
    var result = wsRemoveSplitRegion(true);
    if (result && onSplit) onSplit(result);
    if (setBusy) setBusy(false);
    return true;
  };
  const handleClearSegments = () => {
    if (!readyRef.current) return false;
    if (setBusy) setBusy(true);
    wsClearRegions();
    if (setBusy) setBusy(false);
    return true;
  };
  const handleSegParamChange = (
    silence: number,
    silLen: number,
    segLen: number
  ) => {
    setSegParams({
      silenceThreshold: silence,
      timeThreshold: silLen,
      segLenThreshold: segLen,
    });
  };
  return (
    <div className={classes.root}>
      <Grid container className={classes.toolbar}>
        <Grid item>
          {wsAutoSegment && (
            <div>
              <LightTooltip
                id="wsSegmentTip"
                title={t.autoSegment.replace('[{0}]', '')}
              >
                <span>
                  <IconButton
                    id="wsSegment"
                    onClick={handleAutoSegment}
                    disabled={!ready || playing || busyRef.current}
                  >
                    <IoMdBarcode />
                  </IconButton>
                </span>
              </LightTooltip>
              <LightTooltip id="wsSettingsTip" title={t.segmentSettings}>
                <span>
                  <IconButton
                    id="wsSegmentSettings"
                    onClick={handleShowSettings}
                    disabled={playing}
                  >
                    <SettingsIcon fontSize="small" />
                  </IconButton>
                </span>
              </LightTooltip>
              <WSSegmentParameters
                loop={loop}
                params={segParams}
                currentNumRegions={currentNumRegions}
                wsAutoSegment={wsAutoSegment}
                isOpen={showSettings && !playing}
                onOpen={setShowSettings}
                onSave={handleSegParamChange}
                setBusy={setBusy}
              />
            </div>
          )}

          <LightTooltip
            id="wsSplitTip"
            title={t.splitSegment.replace('{0}', localizeHotKey(ADDREMSEG_KEY))}
          >
            <span>
              <IconButton id="wsSplit" onClick={handleSplit}>
                <PlusMinusLogo disabled={!ready || busyRef.current} />
              </IconButton>
            </span>
          </LightTooltip>
          <LightTooltip
            id="wsJoinTip"
            title={t.removeSegment.replace('{0}', localizeHotKey(DELREG_KEY))}
          >
            <span>
              <IconButton
                id="wsJoin"
                onClick={handleRemoveNextSplit}
                disabled={!ready || busyRef.current}
              >
                <RemoveOneIcon />
              </IconButton>
            </span>
          </LightTooltip>
          <LightTooltip id="wsDeleteTip" title={t.removeAll}>
            <span>
              <IconButton
                id="wsSegmentClear"
                onClick={handleClearSegments}
                disabled={!ready || busyRef.current}
              >
                <ClearIcon fontSize="small" />
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
