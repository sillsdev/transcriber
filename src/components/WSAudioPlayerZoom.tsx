import {
  makeStyles,
  Theme,
  createStyles,
  IconButton,
  Grid,
} from '@material-ui/core';
import React, { useState } from 'react';
import { LightTooltip } from '../control';
import { IWsAudioPlayerStrings } from '../model';
import ZoomInIcon from '@material-ui/icons/ZoomIn';
import ZoomOutIcon from '@material-ui/icons/ZoomOut';
import ZoomWidthIcon from '@material-ui/icons/Pageview';

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
interface IProps {
  t: IWsAudioPlayerStrings;
  startBig: boolean;
  ready: boolean;
  wsSetHeight: (val: number) => void;
  wsZoom: (val: number) => number;
}
export function WSAudioPlayerZoom(props: IProps) {
  const classes = useStyles();
  const zoomMin = 2;
  const zoomMax = 1000;

  const { ready, wsZoom } = props;
  const [zoom, setZoom] = useState(50);

  const handleZoomIn = () => {
    setZoom(wsZoom(Math.min(zoom * 2, zoomMax)));
  };
  const handleZoomOut = () => {
    setZoom(wsZoom(Math.max(zoom / 2, zoomMin)));
  };
  const handleZoomFull = () => {
    setZoom(wsZoom(0));
  };
  return (
    <div className={classes.root}>
      <Grid container className={classes.toolbar}>
        <Grid item>
          <LightTooltip id="wszoominTip" title={'TODO:Zoom In'}>
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
          <LightTooltip id="wszoomoutTip" title={'TODO:Zoom Out'}>
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
          <LightTooltip id="wszoomfullTip" title={'TODO:Fit File to Width'}>
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
