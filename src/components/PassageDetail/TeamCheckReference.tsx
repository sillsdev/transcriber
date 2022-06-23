import { useContext, useRef } from 'react';
import { Grid, makeStyles, createStyles, Theme } from '@material-ui/core';
import SelectMyResource from './Internalization/SelectMyResource';
import { MediaPlayer } from '../MediaPlayer';
import Auth from '../../auth/Auth';
import { PassageDetailContext } from '../../context/PassageDetailContext';
import { getSegments, NamedRegions } from '../../utils';

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
    rowData,
    playItem,
    setPlayItem,
    setMediaSelected,
    itemPlaying,
    setItemPlaying,
    handleItemPlayEnd,
    handleItemTogglePlay,
  } = ctx.state;
  const mediaStart = useRef<number | undefined>();
  const mediaEnd = useRef<number | undefined>();
  const mediaPosition = useRef<number | undefined>();

  const handleResource = (id: string) => {
    const row = rowData.find((r) => r.id === id);
    if (row) {
      const segs = getSegments(
        NamedRegions.ProjectResource,
        row.mediafile.attributes.segments
      );
      const regions = JSON.parse(segs);
      if (regions.length > 0) {
        const { start, end } = regions[0];
        mediaStart.current = start;
        mediaEnd.current = end;
        setMediaSelected(id, start, end);
        return;
      }
    }
    setPlayItem(id);
  };

  const handleEnded = () => {
    mediaStart.current = undefined;
    mediaEnd.current = undefined;
    mediaPosition.current = undefined;
    setPlayItem('');
    handleItemPlayEnd();
  };

  const handleDuration = (duration: number) => {
    if (mediaStart.current) {
      mediaPosition.current = mediaStart.current;
      mediaStart.current = undefined;
      setItemPlaying(true);
    }
  };

  const handlePosition = (position: number) => {
    if (mediaEnd.current) {
      if (position >= mediaEnd.current) {
        handleEnded();
      }
    }
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
          onEnded={handleEnded}
          onDuration={handleDuration}
          onPosition={handlePosition}
          position={mediaPosition.current}
          controls={true}
        />
      </Grid>
    </Grid>
  );
}

export default TeamCheckReference;
