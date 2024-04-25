import { IconButton, Grid } from '@mui/material';
import { useContext, useEffect, useRef, useState } from 'react';
import { GrowingDiv, LightTooltip, ToolbarGrid } from '../control';
import { IWsAudioPlayerZoomStrings } from '../model';
import { HotKeyContext } from '../context/HotKeyContext';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import ZoomWidthIcon from '@mui/icons-material/Pageview';
import { useSelector } from 'react-redux';
import { audioPlayerZoomSelector } from '../selector';

interface IProps {
  ready: boolean;
  wsZoom: (val: number) => number;
  wsPctWidth: () => number;
}
function WSAudioPlayerZoom(props: IProps) {
  const { subscribe, unsubscribe, localizeHotKey } =
    useContext(HotKeyContext).state;
  const [zoomMin, setZoomMin] = useState(5);
  const [zoom, setZoomx] = useState(20);
  const zoomRef = useRef(20);
  const zoomMax = 500;

  const { ready, wsZoom, wsPctWidth } = props;
  const t: IWsAudioPlayerZoomStrings = useSelector(audioPlayerZoomSelector);
  const readyRef = useRef(ready);

  const ZOOMIN_KEY = 'CTRL+1';
  const ZOOMOUT_KEY = 'CTRL+3';

  useEffect(() => {
    readyRef.current = ready;
  }, [ready]);

  const setZoom = (value: number) => {
    zoomRef.current = value;
    setZoomx(value);
    wsZoom(value);
  };
  const handleZoomIn = () => {
    if (!readyRef.current) return false;
    setZoom(Math.min(zoomRef.current * 2, zoomMax));
    return true;
  };
  const handleZoomOut = () => {
    if (!readyRef.current) return false;
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
    <GrowingDiv>
      <ToolbarGrid container>
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
      </ToolbarGrid>
    </GrowingDiv>
  );
}
export default WSAudioPlayerZoom;
