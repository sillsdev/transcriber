import {
  makeStyles,
  Theme,
  createStyles,
  IconButton,
  Grid,
} from '@material-ui/core';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { LightTooltip } from '../control';
import { IState, IWsAudioPlayerZoomStrings } from '../model';
import { HotKeyContext } from '../context/HotKeyContext';
import ZoomInIcon from '@material-ui/icons/ZoomIn';
import ZoomOutIcon from '@material-ui/icons/ZoomOut';
import ZoomWidthIcon from '@material-ui/icons/Pageview';
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
  })
);
interface IStateProps {
  t: IWsAudioPlayerZoomStrings;
}
interface IProps extends IStateProps {
  ready: boolean;
  wsZoom: (val: number) => number;
  wsPctWidth: () => number;
}
function WSAudioPlayerZoom(props: IProps) {
  const classes = useStyles();
  const { subscribe, unsubscribe, localizeHotKey } =
    useContext(HotKeyContext).state;
  const [zoomMin, setZoomMin] = useState(5);
  const [zoom, setZoomx] = useState(20);
  const zoomRef = useRef(20);
  const zoomMax = 500;

  const { t, ready, wsZoom, wsPctWidth } = props;

  const ZOOMIN_KEY = 'CTRL+1';
  const ZOOMOUT_KEY = 'CTRL+3';
  const setZoom = (value: number) => {
    zoomRef.current = value;
    setZoomx(value);
    wsZoom(value);
  };
  const handleZoomIn = () => {
    setZoom(Math.min(zoomRef.current * 2, zoomMax));
    return true;
  };
  const handleZoomOut = () => {
    setZoom(Math.max(zoomRef.current / 2, zoomMin));
    if (wsPctWidth() === 1) setZoomMin(zoomRef.current);
    return true;
  };
  const handleZoomFull = () => {
    wsZoom(0);
    setZoom(zoomMin); //this isn't right...but I guess good enough...
    return zoomRef.current;
  };

  useEffect(() => {
    const keys = [
      { key: ZOOMIN_KEY, cb: handleZoomIn },
      { key: ZOOMOUT_KEY, cb: handleZoomOut },
    ];
    keys.forEach((k) => subscribe(k.key, k.cb));
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      keys.forEach((k) => unsubscribe(k.key));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={classes.root}>
      <Grid container className={classes.toolbar}>
        <Grid item>
          <LightTooltip
            id="wszoominTip"
            title={t.zoomIn.replace('{0}', localizeHotKey(ZOOMIN_KEY))}
          >
            <span>
              <IconButton
                id="wsZoomIn"
                onClick={handleZoomIn}
                disabled={!ready || zoom === zoomMax}
              >
                <ZoomInIcon />
              </IconButton>
            </span>
          </LightTooltip>
          <LightTooltip
            id="wszoomoutTip"
            title={t.zoomOut.replace('{0}', localizeHotKey(ZOOMOUT_KEY))}
          >
            <span>
              <IconButton
                id="wsZoomOut"
                onClick={handleZoomOut}
                disabled={!ready || zoom === zoomMin}
              >
                <ZoomOutIcon />
              </IconButton>
            </span>
          </LightTooltip>
          <LightTooltip id="wszoomfullTip" title={t.fitToWidth}>
            <span>
              <IconButton
                id="wsZoomFull"
                onClick={handleZoomFull}
                disabled={!ready}
              >
                <ZoomWidthIcon />
              </IconButton>
            </span>
          </LightTooltip>
        </Grid>
      </Grid>
    </div>
  );
}
const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'wsAudioPlayerZoom' }),
});

export default connect(mapStateToProps)(WSAudioPlayerZoom) as any;
