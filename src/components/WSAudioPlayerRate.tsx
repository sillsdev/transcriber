import React from 'react';
import { Grid, Box, IconButton, SxProps } from '@mui/material';
import { FaAngleDoubleUp, FaAngleDoubleDown } from 'react-icons/fa';
import type { IconBaseProps } from 'react-icons/lib';
import { IosSlider } from '../control/IosSlider';
import { LightTooltip } from '../control/LightTooltip';
import { IWsAudioPlayerStrings } from '../model';
import { useSelector } from 'react-redux';
import { wsAudioPlayerSelector } from '../selector';
import { shallowEqual } from 'react-redux';

const AngleDoubleUp = FaAngleDoubleUp as unknown as React.FC<IconBaseProps>;
const AngleDoubleDown = FaAngleDoubleDown as unknown as React.FC<IconBaseProps>;

const toolbarProp = {
  flexDirection: 'row',
  alignItems: 'center',
  justifyItems: 'flex-start',
  display: 'flex',
} as SxProps;

const MIN_SPEED = 0.25;
const MAX_SPEED = 4;
const SLOWER_KEY = 'F4,CTRL+4';
const FASTER_KEY = 'F5,CTRL+5';

interface IProps {
  playbackRate: number;
  setPlaybackRate: (rate: number) => void;
  recording: boolean;
  localizeHotKey: (key: string) => string;
}

function WSAudioPlayerRate(props: IProps) {
  const { playbackRate, setPlaybackRate, recording, localizeHotKey } = props;
  const t: IWsAudioPlayerStrings = useSelector(
    wsAudioPlayerSelector,
    shallowEqual
  );

  const handleSliderChange = (event: Event, value: number | number[]) => {
    if (Array.isArray(value)) value = value[0]; //won't be
    setPlaybackRate(value);
  };

  const handleFaster = () => {
    if (playbackRate === MAX_SPEED || recording) return false;
    setPlaybackRate(Math.min(MAX_SPEED, playbackRate * 2));
    return true;
  };

  const handleSlower = () => {
    if (playbackRate === MIN_SPEED || recording) return false;
    setPlaybackRate(Math.max(MIN_SPEED, playbackRate / 2));
    return true;
  };

  return (
    <>
      <Grid item>
        <Box sx={toolbarProp}>
          <>
            <LightTooltip
              id="wsAudioSlowerTip"
              title={t.slowerTip.replace('{0}', localizeHotKey(SLOWER_KEY))}
            >
              <span>
                <IconButton
                  id="wsAudioSlower"
                  onClick={handleSlower}
                  disabled={playbackRate === MIN_SPEED || recording}
                >
                  <AngleDoubleDown fontSize="small" />{' '}
                </IconButton>
              </span>
            </LightTooltip>
            <IosSlider
              id="wsAudioPlaybackSpeed"
              aria-label="ios slider"
              value={playbackRate}
              step={null}
              marks={[
                { value: 0.25 }, //, label: '0.25x' },
                { value: 0.5 },
                { value: 1 },
                { value: 2 },
                { value: 4 },
              ]}
              min={MIN_SPEED}
              max={MAX_SPEED}
              valueLabelDisplay="on"
              getAriaValueText={(value) => `${value}x`}
              valueLabelFormat={(value) => `${value}x`}
              onChange={handleSliderChange}
            />
            <LightTooltip
              id="wsAudioFasterTip"
              title={t.fasterTip.replace('{0}', localizeHotKey(FASTER_KEY))}
            >
              <span>
                <IconButton
                  id="wsAudioFaster"
                  onClick={handleFaster}
                  disabled={playbackRate === MAX_SPEED || recording}
                >
                  <AngleDoubleUp fontSize="small" />{' '}
                </IconButton>
              </span>
            </LightTooltip>
          </>
        </Box>
      </Grid>
    </>
  );
}

export default WSAudioPlayerRate;
