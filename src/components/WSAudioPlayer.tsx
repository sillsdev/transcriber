import {
  makeStyles,
  Theme,
  createStyles,
  Paper,
  Grid,
  IconButton,
  Tooltip,
  Typography,
  Slider,
  Button,
} from '@material-ui/core';
import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import SkipPreviousIcon from '@material-ui/icons/SkipPrevious';
import SkipNextIcon from '@material-ui/icons/SkipNext';
import ForwardIcon from '@material-ui/icons/Forward';
import ReplayIcon from '@material-ui/icons/Replay';
import PlayIcon from '@material-ui/icons/PlayArrow';
import PauseIcon from '@material-ui/icons/Pause';
import { FaAngleDoubleUp, FaAngleDoubleDown } from 'react-icons/fa';
//import { createWaveSurfer } from './WSAudioRegion';
import { useMediaRecorder } from '../crud/useMediaRecorder';
import { useWaveSurfer } from '../crud/useWaveSurfer';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      flexGrow: 1,
    },
    paper: {
      padding: theme.spacing(2),
      margin: 'auto',
    },
    description: {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
    progress: {
      flexGrow: 1,
      margin: theme.spacing(2),
      cursor: 'pointer',
    },
    slider: {
      width: '80px',
    },
    history: {
      overflow: 'auto',
    },
    button: {
      marginLeft: theme.spacing(1),
      marginRight: theme.spacing(1),
    },
    player: {
      display: 'none',
    },
  })
);
interface IStateProps {}

interface IProps extends IStateProps {
  visible: boolean;
  blob?: Blob;
  allowRecord?: boolean;
}

const SPEED_STEP = 0.2;
const MIN_SPEED = 0;
const MAX_SPEED = 2;
const PLAY_PAUSE_KEY = 'ESC';
const BACK_KEY = 'F2';
const AHEAD_KEY = 'F3';
const SLOWER_KEY = 'F4';
const RESET_KEY = 'F5';
const FASTER_KEY = 'F6';

function WSAudioPlayer(props: IProps) {
  const { blob, allowRecord } = props;
  const [audioBlob, setAudioBlob] = useState<Blob | undefined>();
  const waveformRef = useRef<any>();
  const classes = useStyles();
  const [jump] = useState(2);
  const [paused, setPaused] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [recording, setRecording] = useState(false);
  const {
    wsLoad,
    wsIsReady,
    wsIsPlaying,
    wsTogglePlay,
    wsPlay,
    wsPause,
    wsDuration,
    wsSetPlaybackRate,
    wsSkip,
    wsGoto,
    wsSetHeight,
  } = useWaveSurfer(
    waveformRef.current,
    onWSReady,
    () => {},
    () => {},
    50
  );
  const {
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
  } = useMediaRecorder(
    onRecordStart,
    onRecordStop,
    onRecordError,
    onRecordDataAvailable
  );

  const paperStyle = {};
  useEffect(() => {
    setAudioBlob(blob);
  }, [blob]);

  useEffect(() => {
    console.log('loading blob', audioBlob?.size);
    if (audioBlob) wsLoad(audioBlob);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioBlob]);

  useEffect(() => {
    wsSetPlaybackRate(playbackRate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playbackRate]);

  const handlePlayStatus = () => () => wsTogglePlay();
  function onRecordStart() {
    wsSetHeight(200);
    console.log('do something on start?');
  }
  function onRecordStop(blob: Blob) {
    setAudioBlob(blob);
    wsPlay();
    console.log('do something on stop?', blob?.size);
  }
  function onRecordError(e: any) {
    console.log(e.error);
  }
  function onRecordDataAvailable(e: any, blob?: Blob) {
    console.log('data available', blob?.size);
    setAudioBlob(blob);
  }
  function onWSReady() {
    console.log('wavesurfer loaded');
  }
  function handleRecorder() {
    if (!recording) {
      wsPause();
      startRecording(100);
    } else {
      stopRecording();
    }
    setRecording(!recording);
  }
  function handlePause() {
    if (paused) {
      resumeRecording();
    } else {
      pauseRecording();
    }
    setPaused(!paused);
  }
  const handleSliderChange = (
    event: ChangeEvent<{}>,
    value: number | number[]
  ) => {
    if (Array.isArray(value)) value = value[0]; //won't be
    setPlaybackRate(value / 100);
  };
  const handleSlower = () => {
    setPlaybackRate(Math.max(MIN_SPEED, playbackRate - SPEED_STEP));
  };
  const handleFaster = () => {
    setPlaybackRate(Math.min(MAX_SPEED, playbackRate + SPEED_STEP));
  };
  const handleResetPlayback = () => {
    setPlaybackRate(1);
  };
  const handleJumpFn = (amount: number) => {
    if (!wsIsReady()) return;
    wsSkip(amount);
  };
  const handleJumpEv = (amount: number) => () => handleJumpFn(amount);
  const handleGotoEv = (place: number) => () => wsGoto(place);

  const handleKey = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case PLAY_PAUSE_KEY:
        wsTogglePlay();
        e.preventDefault();
        return;
      case BACK_KEY:
        handleJumpFn(-1 * jump);
        e.preventDefault();
        return;
      case AHEAD_KEY:
        handleJumpFn(jump);
        e.preventDefault();
        return;
      case SLOWER_KEY:
        handleSlower();
        e.preventDefault();
        return;
      case FASTER_KEY:
        handleFaster();
        e.preventDefault();
        return;
      case RESET_KEY:
        handleResetPlayback();
        e.preventDefault();
        return;
    }
  };
  const t = {
    backTip: 'Back {0}',
    playTip: 'Play {0}',
    pauseTip: 'Pause {0}',
    aheadTip: 'Ahead {0}',
    slowerTip: 'Slower {0}',
    fasterTip: 'Faster {0}',
    resetTip: 'Reset Speed {0}',
  };
  function valuetext(value: number) {
    return `${Math.floor(value)}%`;
  }
  return (
    <div className={classes.root}>
      <Paper className={classes.paper} onKeyDown={handleKey} style={paperStyle}>
        <div ref={waveformRef} />
        {allowRecord && (
          <>
            <Button
              variant="outlined"
              color="primary"
              className={classes.button}
              onClick={handleRecorder}
            >
              {recording ? 'Stop' : 'Record'}
            </Button>
            <Button
              variant="outlined"
              color="primary"
              className={classes.button}
              onClick={handlePause}
              disabled={!recording}
            >
              {paused ? 'Resume' : 'Pause'}
            </Button>{' '}
          </>
        )}
        <Grid item xs>
          <Grid container justify="center">
            <Tooltip title={'t.beginning'}>
              <span>
                <IconButton onClick={handleGotoEv(0)} disabled={!wsIsReady()}>
                  <>
                    <SkipPreviousIcon />
                  </>
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title={t.backTip.replace('{0}', BACK_KEY)}>
              <span>
                <IconButton
                  onClick={handleJumpEv(-1 * jump)}
                  disabled={!wsIsReady()}
                >
                  <>
                    <ReplayIcon /> <Typography>{BACK_KEY}</Typography>
                  </>
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip
              title={(wsIsPlaying() ? t.playTip : t.pauseTip).replace(
                '{0}',
                PLAY_PAUSE_KEY
              )}
            >
              <span>
                <IconButton
                  onClick={handlePlayStatus()}
                  disabled={wsDuration() === 0}
                >
                  <>
                    {wsIsPlaying() ? <PauseIcon /> : <PlayIcon />}{' '}
                    <Typography>{PLAY_PAUSE_KEY}</Typography>
                  </>
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title={t.aheadTip.replace('{0}', AHEAD_KEY)}>
              <span>
                <IconButton
                  onClick={handleJumpEv(jump)}
                  disabled={!wsIsReady()}
                >
                  <>
                    <ForwardIcon /> <Typography>{AHEAD_KEY}</Typography>
                  </>
                </IconButton>
              </span>
            </Tooltip>

            <Tooltip title={'t.end'}>
              <span>
                <IconButton
                  onClick={handleGotoEv(wsDuration())}
                  disabled={!wsIsReady()}
                >
                  <>
                    <SkipNextIcon />{' '}
                  </>
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title={t.slowerTip.replace('{0}', SLOWER_KEY)}>
              <span>
                <IconButton
                  onClick={handleSlower}
                  disabled={playbackRate === MIN_SPEED}
                >
                  <>
                    <FaAngleDoubleDown /> <Typography>{SLOWER_KEY}</Typography>
                  </>
                </IconButton>
              </span>
            </Tooltip>
            <Slider
              className={classes.slider}
              value={typeof playbackRate === 'number' ? playbackRate * 100 : 0}
              step={SPEED_STEP * 100}
              marks
              min={MIN_SPEED * 100}
              max={MAX_SPEED * 100}
              onChange={handleSliderChange}
              valueLabelDisplay="auto"
              valueLabelFormat={valuetext}
            />

            <Tooltip title={t.fasterTip.replace('{0}', FASTER_KEY)}>
              <span>
                <IconButton
                  onClick={handleFaster}
                  disabled={playbackRate === MAX_SPEED}
                >
                  <>
                    <FaAngleDoubleUp /> <Typography>{FASTER_KEY}</Typography>
                  </>
                </IconButton>
              </span>
            </Tooltip>
          </Grid>
        </Grid>
      </Paper>
    </div>
  );
}
/*
const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: "mediaUpload" }),
});
*/
export default /*connect(mapStateToProps)*/ WSAudioPlayer as any;
