import { useState, useEffect, useRef } from 'react';
import { Grid, makeStyles, createStyles, Theme } from '@material-ui/core';
import SelectMyResource from './Internalization/SelectMyResource';
import { MediaPlayer } from '../MediaPlayer';
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
  const [duration, setDuration] = useState(0);

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
      <Grid item md={6} sm={12} className={classes.playStatus}>
        <MediaPlayer
          auth={auth}
          srcMediaId={playItem}
          requestPlay={playing}
          onEnded={handleEnded}
          onDuration={handleDuration}
          controls={true}
        />
      </Grid>
    </Grid>
  );
}

export default TeamCheckReference;
