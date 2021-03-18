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
  Box,
  InputLabel,
} from '@material-ui/core';
import ToggleButton from '@material-ui/lab/ToggleButton';
import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import SkipPreviousIcon from '@material-ui/icons/SkipPrevious';
import SkipNextIcon from '@material-ui/icons/SkipNext';
import ForwardIcon from '@material-ui/icons/Refresh';
import ReplayIcon from '@material-ui/icons/Replay';
import PlayIcon from '@material-ui/icons/PlayArrow';
import PauseIcon from '@material-ui/icons/Pause';
import LoopIcon from '@material-ui/icons/Loop';
import DeleteIcon from '@material-ui/icons/Delete';
import SilenceIcon from '@material-ui/icons/SpaceBar';
import InsertIcon from '@material-ui/icons/Add';
import OverwriteIcon from '@material-ui/icons/Remove';
import localStrings from '../selector/localize';
import { IState, IWsAudioPlayerStrings } from '../model';
import {
  FaAngleDoubleUp,
  FaAngleDoubleDown,
  FaDotCircle,
  FaStopCircle,
  FaPauseCircle,
} from 'react-icons/fa';
//import { createWaveSurfer } from './WSAudioRegion';
import { useMediaRecorder } from '../crud/useMediaRecorder';
import { useWaveSurfer } from '../crud/useWaveSurfer';
import { Duration } from '../control';
import { connect } from 'react-redux';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      flexGrow: 1,
    },
    paper: {
      padding: theme.spacing(2),
      margin: 'auto',
    },
    progress: {
      flexGrow: 1,
      margin: theme.spacing(2),
      cursor: 'pointer',
    },
    slider: {
      width: '80px',
    },
    record: {
      color: 'red',
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
  t: IWsAudioPlayerStrings;
}

interface IProps extends IStateProps {
  visible: boolean;
  blob?: Blob;
  allowRecord?: boolean;
  onPlayStatus?: (playing: boolean) => void;
  onProgress?: (progress: number) => void;
  recordingReady?: (blob: Blob) => void;
  setChanged?: (changed: boolean) => void;
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
  const {
    blob,
    allowRecord,
    onProgress,
    onPlayStatus,
    recordingReady,
    setChanged,
  } = props;
  const [audioBlob, setAudioBlob] = useState<Blob | undefined>();
  const waveformRef = useRef<any>();
  const timelineRef = useRef<any>();

  const classes = useStyles();
  const [jump] = useState(2);

  const [playbackRate, setPlaybackRate] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [looping, setLooping] = useState(false);
  const [hasRegion, setHasRegion] = useState(false);
  const recordStartPosition = useRef(0);
  const [overwrite, setOverwrite] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordingPaused, setRecordingPaused] = useState(false);
  const [ready, setReady] = useState(false);
  const [silence, setSilence] = useState(1.0);
  const {
    wsLoad,
    wsTogglePlay,
    // wsPlay,
    wsPause,
    wsDuration,
    wsPosition,
    wsSetPlaybackRate,
    wsSkip,
    wsGoto,
    wsLoopRegion,
    wsRegionDelete,
    wsInsertAudio,
    wsInsertSilence,
  } = useWaveSurfer(
    waveformRef.current,
    onWSReady,
    onWSProgress,
    onWSRegion,
    onWSStop,
    () => {},
    allowRecord ? 200 : 50,
    timelineRef.current
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

  const handlePlayStatus = () => {
    const playing = wsTogglePlay();
    setPlaying(playing);
    if (onPlayStatus) onPlayStatus(playing);
  };
  function onRecordStart() {
    console.log('do something on start?');
  }
  function onRecordStop(blob: Blob) {
    wsInsertAudio(blob, recordStartPosition.current, overwrite);
    //wsPlay();
    if (recordingReady) recordingReady(blob);
    console.log('do something on stop?', blob?.size);
  }
  function onRecordError(e: any) {
    console.log(e.error);
  }
  function onRecordDataAvailable(e: any, blob: Blob) {
    console.log('data available', blob?.size, recordStartPosition.current);
    wsInsertAudio(blob, recordStartPosition.current, overwrite);
    //setAudioBlob(blob);
  }
  function onWSReady() {
    console.log('wavesurfer loaded');
    setReady(true);
  }
  function onWSProgress(progress: number) {
    if (onProgress) onProgress(progress);
  }
  function onWSRegion(region: boolean) {
    setHasRegion(region);
    setLooping(wsLoopRegion(region && !allowRecord));
    //forceUpdate(1);
  }
  function onWSStop() {
    setPlaying(false);
    if (onPlayStatus) onPlayStatus(false);
  }

  function handlePause() {
    if (recordingPaused) {
      resumeRecording();
    } else {
      pauseRecording();
    }
    setRecordingPaused(!recordingPaused);
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
    if (!ready) return;
    wsSkip(amount);
  };
  const handleJumpEv = (amount: number) => () => handleJumpFn(amount);
  const handleGotoEv = (place: number) => () => wsGoto(place);
  const handleToggleLoop = () => () => {
    console.log('handleToggleLoop');
    setLooping(wsLoopRegion(!looping));
  };
  const handleInsertOverwrite = () => {
    setOverwrite(!overwrite);
  };

  const handleRecorder = () => {
    if (!recording) {
      wsPause();
      console.log('start record', wsPosition());
      recordStartPosition.current = wsPosition();
      startRecording(100);
    } else {
      stopRecording();
    }
    setRecording(!recording);
  };

  const handleDeleteRegion = () => () => {
    console.log('delete region');
    //var cutbuffer =
    wsRegionDelete();
    if (setChanged) setChanged(true);
  };
  const handleAddSilence = () => () => {
    console.log('add silence');
    wsInsertSilence(silence, wsPosition());
    if (setChanged) setChanged(true);
  };

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
  const handleChangeSilence = (e: any) => {
    //check if its a number
    e.persist();
    setSilence(e.target.value);
  };
  return (
    <div className={classes.root}>
      <Paper className={classes.paper} onKeyDown={handleKey} style={paperStyle}>
        <Grid item xs>
          <Grid container>
            {allowRecord && (
              <>
                <Tooltip title={overwrite ? 't.overwrite' : 't.insert'}>
                  <IconButton onClick={handleInsertOverwrite}>
                    {overwrite ? <OverwriteIcon /> : <InsertIcon />}
                  </IconButton>
                </Tooltip>
                <Tooltip title={recording ? 't.stop' : 't.record'}>
                  <IconButton
                    className={classes.record}
                    onClick={handleRecorder}
                  >
                    {recording ? <FaStopCircle /> : <FaDotCircle />}
                  </IconButton>
                </Tooltip>
                {recording && (
                  <Tooltip title={recordingPaused ? 't.resume' : 't.pause'}>
                    <IconButton onClick={handlePause}>
                      {recordingPaused ? (
                        <FaPauseCircle className={classes.record} />
                      ) : (
                        <FaPauseCircle />
                      )}
                    </IconButton>
                  </Tooltip>
                )}
                <Box display="flex" border={1}>
                  <Grid item xs>
                    <Grid container direction="column">
                      <InputLabel shrink>t.addSilence</InputLabel>
                      <Tooltip title={'t.silence'}>
                        <IconButton
                          className={classes.togglebutton}
                          onClick={handleAddSilence()}
                          disabled={!ready}
                        >
                          <SilenceIcon />
                        </IconButton>
                      </Tooltip>
                    </Grid>
                  </Grid>
                  <Grid item xs>
                    <Grid container direction="column">
                      <InputLabel shrink>seconds</InputLabel>
                      <input
                        className={classes.formControl}
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={silence}
                        onChange={handleChangeSilence}
                      />
                    </Grid>
                  </Grid>
                </Box>
                {hasRegion && (
                  <Tooltip title={'t.deleteregion'}>
                    <IconButton onClick={handleDeleteRegion()}>
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                )}
              </>
            )}
          </Grid>
        </Grid>
        <Typography>
          <Duration seconds={wsPosition()} /> {' / '}
          <Duration seconds={wsDuration()} />
        </Typography>
        <div ref={timelineRef} />
        <div ref={waveformRef} />
        <Grid item xs>
          <Grid container justify="center">
            {allowRecord || (
              <Tooltip title={'t.loop' + looping ? ' on' : ' off'}>
                <ToggleButton
                  className={classes.togglebutton}
                  value="loop"
                  selected={looping}
                  onChange={handleToggleLoop()}
                  disabled={!hasRegion}
                >
                  <LoopIcon />
                </ToggleButton>
              </Tooltip>
            )}
            <Tooltip title={'t.beginning'}>
              <IconButton onClick={handleGotoEv(0)} disabled={!ready}>
                <SkipPreviousIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title={t.backTip.replace('{0}', BACK_KEY)}>
              <IconButton onClick={handleJumpEv(-1 * jump)} disabled={!ready}>
                <ReplayIcon /> <Typography>{BACK_KEY}</Typography>
              </IconButton>
            </Tooltip>
            <Tooltip
              title={(playing ? t.pauseTip : t.playTip).replace(
                '{0}',
                PLAY_PAUSE_KEY
              )}
            >
              <IconButton
                onClick={handlePlayStatus}
                disabled={wsDuration() === 0}
              >
                <>
                  {playing ? <PauseIcon /> : <PlayIcon />}
                  <Typography>{PLAY_PAUSE_KEY}</Typography>
                </>
              </IconButton>
            </Tooltip>
            <Tooltip title={t.aheadTip.replace('{0}', AHEAD_KEY)}>
              <IconButton onClick={handleJumpEv(jump)} disabled={!ready}>
                <ForwardIcon /> <Typography>{AHEAD_KEY}</Typography>
              </IconButton>
            </Tooltip>

            <Tooltip title={'t.end'}>
              <IconButton
                onClick={handleGotoEv(wsDuration())}
                disabled={!ready}
              >
                <SkipNextIcon />{' '}
              </IconButton>
            </Tooltip>
            <Tooltip title={t.slowerTip.replace('{0}', SLOWER_KEY)}>
              <IconButton
                onClick={handleSlower}
                disabled={playbackRate === MIN_SPEED}
              >
                <FaAngleDoubleDown /> <Typography>{SLOWER_KEY}</Typography>
              </IconButton>
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
              <IconButton
                onClick={handleFaster}
                disabled={playbackRate === MAX_SPEED}
              >
                <FaAngleDoubleUp /> <Typography>{FASTER_KEY}</Typography>
              </IconButton>
            </Tooltip>
          </Grid>
        </Grid>
      </Paper>
    </div>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'wsAudioPlayer' }),
});

export default connect(mapStateToProps)(WSAudioPlayer) as any;
