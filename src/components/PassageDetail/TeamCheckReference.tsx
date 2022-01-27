import { useState, useEffect, useRef } from 'react';
import {
  Grid,
  Typography,
  Slider,
  IconButton,
  makeStyles,
  createStyles,
  Theme,
} from '@material-ui/core';
import SelectMyResource from './Internalization/SelectMyResource';
import { Duration } from '../../control';
import BeginIcon from '@material-ui/icons/SkipPrevious';
import BackIcon from '@material-ui/icons/Replay';
import PlayIcon from '@material-ui/icons/PlayArrow';
import PauseIcon from '@material-ui/icons/Pause';
import ForwardIcon from '@material-ui/icons/Refresh';
import EndIcon from '@material-ui/icons/SkipNext';
import { ControlledPlayer } from '../ControlledPlayer';
import Auth from '../../auth/Auth';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    duration: {
      margin: theme.spacing(1),
    },
    resource: {
      margin: theme.spacing(1),
    },
    playStatus: {
      margin: theme.spacing(1),
    },
    slider: {},
    controls: {
      alignSelf: 'center',
    },
  })
);

interface IProps {
  auth: Auth;
}

export function TeamCheckReference({ auth }: IProps) {
  const classes = useStyles();
  const [playItem, setPlayItem] = useState('');
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const newPosition = useRef<number>();

  const setNewPosition = (pos: number) => {
    newPosition.current = pos;
    setPosition(pos);
  };

  const handlePosition = (position: number) => {
    setPosition(position);
    newPosition.current = undefined;
  };

  const handleDuration = (duration: number) => {
    setDuration(duration);
  };

  const handleEnded = () => {
    setPlaying(false);
  };

  const handleResource = (id: string) => {
    setPlayItem(id);
    setPlaying(false);
  };

  const handlePlay = () => {
    setPlaying(!playing);
  };

  const handleBack = () => {
    setNewPosition(Math.max(position - 2, 0));
  };

  const handleForward = () => {
    setNewPosition(Math.min(position + 2, duration - 0.1));
  };

  const handleStart = () => {
    setNewPosition(0);
  };

  const handleToEnd = () => {
    setNewPosition(duration - 0.1);
  };

  useEffect(() => {
    if (duration) {
      setPlaying(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration]);

  return (
    <Grid container direction="row" alignItems="center">
      <Grid item md={4} sm={12} className={classes.resource}>
        <SelectMyResource required onChange={handleResource} />
      </Grid>
      <Grid item>
        <Typography className={classes.duration}>
          <Duration id="resPosition" seconds={position} /> {' / '}
          <Duration id="resDuration" seconds={duration} />
        </Typography>
      </Grid>
      <Grid item md={6} sm={12} className={classes.playStatus}>
        <Grid container direction="column">
          <Grid item>
            <Slider value={Math.round((position * 100) / duration)} />
          </Grid>
          <Grid item className={classes.controls}>
            <IconButton onClick={handleStart} disabled={duration === 0}>
              <BeginIcon />
            </IconButton>
            <IconButton onClick={handleBack} disabled={duration === 0}>
              <BackIcon />
            </IconButton>
            <IconButton onClick={handlePlay} disabled={duration === 0}>
              {!playing ? <PlayIcon /> : <PauseIcon />}
            </IconButton>
            <IconButton onClick={handleForward} disabled={duration === 0}>
              <ForwardIcon />
            </IconButton>
            <IconButton onClick={handleToEnd} disabled={duration === 0}>
              <EndIcon />
            </IconButton>
          </Grid>
        </Grid>
      </Grid>
      <ControlledPlayer
        auth={auth}
        srcMediaId={playItem}
        requestPlay={playing}
        onEnded={handleEnded}
        position={newPosition.current}
        onPosition={handlePosition}
        onDuration={handleDuration}
      />
    </Grid>
  );
}

export default TeamCheckReference;
