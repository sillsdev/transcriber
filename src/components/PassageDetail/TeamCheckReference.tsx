import { useContext } from 'react';
import { Grid, makeStyles, createStyles, Theme } from '@material-ui/core';
import SelectMyResource from './Internalization/SelectMyResource';
import { MediaPlayer } from '../MediaPlayer';
import Auth from '../../auth/Auth';
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
      width: '100%',
      '& audio': {
        display: 'flex',
        width: 'inherit',
      },
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
  const ctx = useContext(PassageDetailContext);
  const {
    playItem,
    setPlayItem,
    itemPlaying,
    handleItemPlayEnd,
    handleItemTogglePlay,
  } = ctx.state;

  const handleResource = (id: string) => {
    setPlayItem(id);
  };

  return (
    <Grid container direction="column">
      <Grid item xs={10} className={classes.resource}>
        <SelectMyResource onChange={handleResource} />
      </Grid>
      <Grid item xs={10} className={classes.playStatus}>
        <MediaPlayer
          auth={auth}
          srcMediaId={playItem}
          requestPlay={itemPlaying}
          onTogglePlay={handleItemTogglePlay}
          onEnded={handleItemPlayEnd}
          controls={true}
        />
      </Grid>
    </Grid>
  );
}

export default TeamCheckReference;
