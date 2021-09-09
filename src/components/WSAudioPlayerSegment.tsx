import {
  makeStyles,
  Theme,
  createStyles,
  IconButton,
  Grid,
} from '@material-ui/core';
import React, { useContext, useEffect, useState } from 'react';
import { LightTooltip } from '../control';
import { IWsAudioPlayerSegmentStrings, IState } from '../model';
import { IoMdBarcode } from 'react-icons/io';
import ClearIcon from '@material-ui/icons/Clear';
import SettingsIcon from '@material-ui/icons/Settings';
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
  onSplit: (split: IRegionChange) => void;
  wsAutoSegment: (loop: boolean, params: IRegionParams) => number;
  wsRemoveSplitRegion: (next?: boolean) => IRegionChange | undefined;
  wsAddOrRemoveRegion: () => IRegionChange | undefined;
}

function WSAudioPlayerSegment(props: IProps) {
  const classes = useStyles();
  const {
    t,
    ready,
    loop,
    currentNumRegions,
    params,
    onSplit,
    wsAutoSegment,
    wsRemoveSplitRegion,
    wsAddOrRemoveRegion,
  } = props;
  const [segParams, setSegParams] = useState<IRegionParams>({
    silenceThreshold: 0.004,
    timeThreshold: 0.02,
    segLenThreshold: 0.5,
  });
  const [showSettings, setShowSettings] = useState(false);
  const { subscribe, unsubscribe, localizeHotKey } =
    useContext(HotKeyContext).state;
  const { showMessage } = useSnackBar();
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

  useEffect(() => {
    setSegParams({
      silenceThreshold: params?.silenceThreshold
        ? params.silenceThreshold
        : 0.004,
      timeThreshold: params?.timeThreshold ? params.timeThreshold : 0.02,
      segLenThreshold: params?.segLenThreshold || 0.5,
    });
  }, [params]);

  const handleAutoSegment = () => {
    var numRegions = wsAutoSegment(loop, segParams);
    showMessage(t.segmentsCreated.replace('{0}', numRegions.toString()));
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
                <IoMdBarcode />
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
            <WSSegmentParameters
              loop={loop}
              params={segParams}
              currentNumRegions={currentNumRegions}
              wsAutoSegment={wsAutoSegment}
              isOpen={showSettings}
              onOpen={setShowSettings}
              onSave={handleSegParamChange}
            />
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
