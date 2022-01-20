import { useContext, useEffect } from 'react';
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
  const classes = useStyles();
  const ctx = useContext(PassageDetailContext);
  const {
    setSelected,
    mediaPlaying,
    setMediaPlaying,
    mediaPosition,
    mediaDuration,
    setMediaPosition,
  } = ctx.state;

  const handleResource = (id: string) => {
    setSelected(id);
    setMediaPlaying(false);
  };

  const handlePlay = () => {
    setMediaPlaying(!mediaPlaying);
  };

  const handleBack = () => {
    setMediaPosition(Math.max(mediaPosition - 2, 0));
  };

  const handleForward = () => {
    setMediaPosition(Math.min(mediaPosition + 2, Math.floor(mediaDuration)));
  };

  const handleStart = () => {
    setMediaPosition(0);
  };

  const handleToEnd = () => {
    setMediaPosition(Math.floor(mediaDuration));
  };

  useEffect(() => {
    if (mediaDuration) {
      setMediaPlaying(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaDuration]);

  return (
    <Grid container direction="row" alignItems="center">
      <Grid item md={4} sm={12} className={classes.resource}>
        <SelectMyResource required onChange={handleResource} />
      </Grid>
      <Grid item>
        <Typography className={classes.duration}>
          <Duration id="resPosition" seconds={mediaPosition} /> {' / '}
          <Duration id="resDuration" seconds={mediaDuration} />
        </Typography>
      </Grid>
      <Grid item md={6} sm={12} className={classes.playStatus}>
        <Grid container direction="column">
          <Grid item>
            <Slider value={Math.round((mediaPosition * 100) / mediaDuration)} />
          </Grid>
          <Grid item className={classes.controls}>
            <IconButton onClick={handleStart}>
              <BeginIcon />
            </IconButton>
            <IconButton onClick={handleBack}>
              <BackIcon />
            </IconButton>
            <IconButton onClick={handlePlay}>
              {!mediaPlaying ? <PlayIcon /> : <PauseIcon />}
            </IconButton>
            <IconButton onClick={handleForward}>
              <ForwardIcon />
            </IconButton>
            <IconButton onClick={handleToEnd}>
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
