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
  InputLabel,
  Divider,
  Switch,
  Input,
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
import localStrings from '../selector/localize';
import { IState, IWsAudioPlayerStrings } from '../model';
import {
  FaAngleDoubleUp,
  FaAngleDoubleDown,
  FaDotCircle,
  FaStopCircle,
  FaPauseCircle,
  FaCut,
} from 'react-icons/fa';
//import { createWaveSurfer } from './WSAudioRegion';
import { useMediaRecorder } from '../crud/useMediaRecorder';
import { useWaveSurfer } from '../crud/useWaveSurfer';
import { Duration } from '../control';
import { connect } from 'react-redux';
import { useSnackBar } from '../hoc/SnackBar';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      flexGrow: 1,
    },
    paper: {
      padding: theme.spacing(2),
      margin: 'auto',
    },
    toolbar: {
      display: 'flex',

    },
    labeledControl: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    },
    progress: {
      flexGrow: 1,
      margin: theme.spacing(2),
      cursor: 'pointer',
    },
    slider: {
      width: '80px',
      verticalAlign: "middle"
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
    grow: {
      flexGrow: 1,
    },
    smallFont: {
      fontSize: 'small'
    },
    divider: {
      marginLeft: '5px'
    }
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
interface VLC_Props {
  children: any;
  open: boolean;
  value: number;
}
function ValueLabelComponent(props: VLC_Props) {
  const { children, open, value } = props;

  function valuetext(value: number) {
    return `${Math.floor(value)}%`;
  }
  return (
    <Tooltip open={open} enterTouchDelay={0} placement="top" title={valuetext(value)}>
      {children}
    </Tooltip>
  );
}

const SPEED_STEP = 0.1;
const MIN_SPEED = .5;
const MAX_SPEED = 1.5;
const PLAY_PAUSE_KEY = 'ESC';
const BACK_KEY = 'F2';
const AHEAD_KEY = 'F3';
const SLOWER_KEY = 'F4';
const RESET_KEY = 'F5';
const FASTER_KEY = 'F6';

function WSAudioPlayer(props: IProps) {
  const {
    t,
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
  const recordOverwritePosition = useRef<number | undefined>(0);
  const [overwrite, setOverwrite] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordingPaused, setRecordingPaused] = useState(false);
  const [ready, setReady] = useState(false);
  const [silence, setSilence] = useState(1.0);
  const { showMessage } = useSnackBar();
  const {
    wsLoad,
    wsTogglePlay,
    //wsPlay,
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
    () => { },
    allowRecord ? 200 : 50,
    timelineRef.current
  );
  //because we have to call hooks consistently, call this even if we aren't going to record
  const {
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
  } = useMediaRecorder(
    allowRecord,
    onRecordStart,
    onRecordStop,
    onRecordError,
    onRecordDataAvailable
  )

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
  async function onRecordStop(blob: Blob) {
    console.log('do something on stop?', blob?.size);
    var newPos = await wsInsertAudio(blob, recordStartPosition.current, recordOverwritePosition.current);
    if (!overwrite)
      recordOverwritePosition.current = newPos;
    //wsPlay();
    if (recordingReady) recordingReady(blob);
  }
  function onRecordError(e: any) {
    console.log('onRecordError', e.error);
    showMessage(e.error);
  }
  async function onRecordDataAvailable(e: any, blob: Blob) {
    console.log('data available', blob?.size, recordStartPosition.current);
    var newPos = await wsInsertAudio(blob, recordStartPosition.current, recordOverwritePosition.current);
    if (!overwrite)
      recordOverwritePosition.current = newPos;
    //setAudioBlob(blob);
  }
  function onWSReady() {
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
      recordOverwritePosition.current = overwrite ? undefined : recordStartPosition.current;
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
  const handleChangeSilence = (e: any) => {
    //check if its a number
    e.persist();
    setSilence(e.target.value);
  };
  return (
    <div className={classes.root}>
      <Paper className={classes.paper} onKeyDown={handleKey} style={paperStyle}>

        {allowRecord && (
          <div className={classes.toolbar}>
            <Tooltip title={recording ? t.stop : t.record}>
              <span>
                <IconButton
                  className={classes.record}
                  onClick={handleRecorder}
                >
                  {recording ? <FaStopCircle /> : <FaDotCircle />}
                </IconButton></span>
            </Tooltip>
            <Tooltip title={recordingPaused ? t.resume : t.pauseRecord}>
              <span>
                <IconButton onClick={handlePause} disabled={!recording}>
                  {recordingPaused ? (
                    <FaPauseCircle className={classes.record} />
                  ) : (
                    <FaPauseCircle />
                  )}

                </IconButton>
              </span>
            </Tooltip>
            <div className={classes.labeledControl}>
              <InputLabel className={classes.smallFont}>Insert/Overwrite</InputLabel>
              <Switch checked={overwrite} onChange={handleInsertOverwrite} name="insertoverwrite" />

            </div>
            <Divider className={classes.divider} orientation="vertical" flexItem />
            <div className={classes.labeledControl}>
              <InputLabel className={classes.smallFont}>{t.silence}</InputLabel>
              <Tooltip title={t.silence}>
                <span>
                  <IconButton
                    className={classes.togglebutton}
                    onClick={handleAddSilence()}
                    disabled={!ready}
                  >
                    <SilenceIcon />
                  </IconButton></span>
              </Tooltip>
            </div>
            <div className={classes.labeledControl}>
              <InputLabel className={classes.smallFont}>{t.seconds}</InputLabel>
              <Input
                className={classes.formControl}
                type="number"
                inputProps={{ min: "0.1", step: "0.1" }}
                value={silence}
                onChange={handleChangeSilence}
              />
            </div>
            <Divider orientation="vertical" flexItem />
            {hasRegion && (
              <Tooltip title={t.deleteRegion}>
                <IconButton onClick={handleDeleteRegion()}>
                  <FaCut />
                </IconButton>
              </Tooltip>
            )}
            <div className={classes.grow}>{'\u00A0'}</div>
          </div>
        )}
        <Typography>
          <Duration seconds={wsPosition()} /> {' / '}
          <Duration seconds={wsDuration()} />
        </Typography>
        <div ref={timelineRef} />
        <div ref={waveformRef} />
        <Grid container justify="flex-start" alignItems="center">
          {allowRecord || (
            <div className={classes.toolbar}>
              <Tooltip title={looping ? t.loopon : t.loopoff} >
                <span>
                  <ToggleButton
                    className={classes.togglebutton}
                    value="loop"
                    selected={looping}
                    onChange={handleToggleLoop()}
                    disabled={!hasRegion}
                  >
                    <LoopIcon />
                  </ToggleButton>
                </span>
              </Tooltip>
              <Divider orientation="vertical" flexItem />
            </div>
          )}
          <Tooltip title={t.beginning}>
            <span>
              <IconButton onClick={handleGotoEv(0)} disabled={!ready}>
                <SkipPreviousIcon />
              </IconButton></span>
          </Tooltip>
          <Tooltip title={t.backTip.replace('{0}', BACK_KEY)}>
            <span>
              <IconButton onClick={handleJumpEv(-1 * jump)} disabled={!ready}>
                <ReplayIcon /><Typography className={classes.smallFont}>{BACK_KEY}</Typography>
              </IconButton></span>
          </Tooltip>
          <Tooltip
            title={(playing ? t.pauseTip : t.playTip).replace(
              '{0}',
              PLAY_PAUSE_KEY
            )}
          ><span>
              <IconButton
                onClick={handlePlayStatus}
                disabled={wsDuration() === 0}
              >
                <>
                  {playing ? <PauseIcon /> : <PlayIcon />}
                  <Typography className={classes.smallFont}>{PLAY_PAUSE_KEY}</Typography>
                </>
              </IconButton></span>
          </Tooltip>
          <Tooltip title={t.aheadTip.replace('{0}', AHEAD_KEY)}>
            <span>
              <IconButton onClick={handleJumpEv(jump)} disabled={!ready}>
                <ForwardIcon /> <Typography className={classes.smallFont}>{AHEAD_KEY}</Typography>
              </IconButton></span>
          </Tooltip>
          <Tooltip title={t.end}>
            <span>
              <IconButton
                onClick={handleGotoEv(wsDuration())}
                disabled={!ready}
              >
                <SkipNextIcon />{' '}
              </IconButton></span>
          </Tooltip>
          <Divider className={classes.divider} orientation="vertical" flexItem />
          <div className={classes.toolbar}>
            <Tooltip title={t.slowerTip.replace('{0}', SLOWER_KEY)}><span>
              <IconButton
                onClick={handleSlower}
                disabled={playbackRate === MIN_SPEED}
              >
                <FaAngleDoubleDown fontSize="small" /> <Typography className={classes.smallFont}>{SLOWER_KEY}</Typography>
              </IconButton></span>
            </Tooltip>
            <Slider
              className={classes.slider}
              value={typeof playbackRate === 'number' ? playbackRate * 100 : 0}
              step={SPEED_STEP * 100}
              marks
              min={MIN_SPEED * 100}
              max={MAX_SPEED * 100}
              onChange={handleSliderChange}
              ValueLabelComponent={ValueLabelComponent}
            />

            <Tooltip title={t.fasterTip.replace('{0}', FASTER_KEY)}>
              <span>
                <IconButton
                  onClick={handleFaster}
                  disabled={playbackRate === MAX_SPEED}
                >
                  <FaAngleDoubleUp fontSize="small" /> <Typography className={classes.smallFont}>{FASTER_KEY}</Typography>
                </IconButton></span>
            </Tooltip>
          </div>
        </Grid>
      </Paper>
    </div >
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'wsAudioPlayer' }),
});

export default connect(mapStateToProps)(WSAudioPlayer) as any;
