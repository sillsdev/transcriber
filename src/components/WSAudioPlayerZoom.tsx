import { IconButton, Grid, Chip } from '@mui/material';
import { useContext, useEffect, useRef, useState } from 'react';
import { GrowingDiv } from '../control/GrowingDiv';
import { LightTooltip } from '../control/LightTooltip';
import { ToolbarGrid } from '../control/ToolbarGrid';
import { IWsAudioPlayerZoomStrings } from '../model';
import { HotKeyContext } from '../context/HotKeyContext';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import ZoomWidthIcon from '@mui/icons-material/Pageview';
import { useSelector } from 'react-redux';
import { audioPlayerZoomSelector } from '../selector';

interface IProps {
  ready: boolean;
  fillPx: number;
  curPx: number;
  onZoom: (val: number) => void;
}
export const maxZoom = 200;

function WSAudioPlayerZoom(props: IProps) {
  const { ready, onZoom, fillPx, curPx } = props;
  const { subscribe, unsubscribe, localizeHotKey } =
    useContext(HotKeyContext).state;
  const [zoomMin, setZoomMin] = useState(fillPx);
  const [zoom, setZoomx] = useState(fillPx);
  const zoomRef = useRef(fillPx);

  const t: IWsAudioPlayerZoomStrings = useSelector(audioPlayerZoomSelector);
  const readyRef = useRef(ready);

  const ZOOMIN_KEY = 'CTRL+1';
  const ZOOMOUT_KEY = 'CTRL+3';

  useEffect(() => {
    readyRef.current = ready;
  }, [ready]);

  useEffect(() => {
    setZoom(curPx, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [curPx]);

  const setZoom = (value: number, tellParent: boolean = true) => {
    value = Math.round(value * 10) / 10;
    zoomRef.current = value;
    setZoomx(value);
    if (tellParent) onZoom(value);
  };
  useEffect(() => {
    setZoom(fillPx);
    setZoomMin(fillPx);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fillPx]);

  const handleZoomIn = () => {
    if (!readyRef.current) return false;
    setZoom(Math.min(zoomRef.current * 2, maxZoom));
    return true;
  };
  const handleZoomOut = () => {
    if (!readyRef.current) return false;
    setZoom(Math.max(zoomRef.current / 2, maxZoom));
    return true;
  };

  const handleZoomFull = () => {
    setZoom(fillPx);
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
          <>
            <LightTooltip
              id="wszoominTip"
              title={t.zoomIn.replace('{0}', localizeHotKey(ZOOMIN_KEY))}
            >
              <span>
                <IconButton
                  id="wsZoomIn"
                  onClick={handleZoomIn}
                  disabled={!ready || zoom === maxZoom}
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
            <Chip label={zoom} size="small" />
          </>
        </Grid>
      </ToolbarGrid>
    </GrowingDiv>
  );
}
export default WSAudioPlayerZoom;
