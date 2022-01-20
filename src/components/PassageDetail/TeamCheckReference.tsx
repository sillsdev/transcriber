import { useState, useContext } from 'react';
import { connect } from 'react-redux';
import { ITeamCheckReferenceStrings, IState } from '../../model';
import localStrings from '../../selector/localize';
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
import { PassageDetailContext } from '../../context/PassageDetailContext';

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

interface IStateProps {
  t: ITeamCheckReferenceStrings;
}

interface IProps extends IStateProps {
  width: number;
}

export function TeamCheckReference(props: IProps) {
  const { width, t } = props;
  const classes = useStyles();
  const ctx = useContext(PassageDetailContext);
  const { currentstep, section } = ctx.state;
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playing, setPlaying] = useState(false);

  const handleResource = (id: string) => {
    console.log(`chosen resource: ${id}`);
  };

  return (
    <Grid container direction="row" alignItems="center">
      <Grid item md={4} sm={12} className={classes.resource}>
        <SelectMyResource required onChange={handleResource} />
      </Grid>
      <Grid item>
        <Typography className={classes.duration}>
          <Duration id="resPosition" seconds={progress} /> {' / '}
          <Duration id="resDuration" seconds={duration} />
        </Typography>
      </Grid>
      <Grid item md={6} sm={12} className={classes.playStatus}>
        <Grid container direction="column">
          <Grid item>
            <Slider />
          </Grid>
          <Grid item className={classes.controls}>
            <IconButton>
              <BeginIcon />
            </IconButton>
            <IconButton>
              <BackIcon />
            </IconButton>
            <IconButton>{!playing ? <PlayIcon /> : <PauseIcon />}</IconButton>
            <IconButton>
              <ForwardIcon />
            </IconButton>
            <IconButton>
              <EndIcon />
            </IconButton>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'teamCheckReference' }),
});

export default connect(mapStateToProps)(TeamCheckReference) as any as any;
