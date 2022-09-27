import { useContext, useRef, useEffect } from 'react';
import { Grid, GridProps, styled } from '@mui/material';
import SelectMyResource from './Internalization/SelectMyResource';
import { MediaPlayer } from '../MediaPlayer';
import { PassageDetailContext } from '../../context/PassageDetailContext';
import { getSegments, LocalKey, localUserKey, NamedRegions } from '../../utils';

const StyledGrid = styled(Grid)<GridProps>(({ theme }) => ({
  margin: theme.spacing(1),
  width: '100%',
  '& audio': {
    display: 'flex',
    width: 'inherit',
  },
}));

export function TeamCheckReference() {
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
    currentstep,
  } = ctx.state;
  const mediaStart = useRef<number | undefined>();
  const mediaEnd = useRef<number | undefined>();
  const mediaPosition = useRef<number | undefined>();

  const handleResource = (id: string) => {
    localStorage.setItem(localUserKey(LocalKey.compare), id);
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

  useEffect(() => {
    const id = localStorage.getItem(localUserKey(LocalKey.compare));
    if (id) setTimeout(() => handleResource(id), 2000);
    setPlayItem('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentstep]);

  const handleEnded = () => {
    mediaStart.current = undefined;
    mediaEnd.current = undefined;
    mediaPosition.current = undefined;
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
      <Grid item xs={10} sx={{ m: 2, p: 2 }}>
        <SelectMyResource onChange={handleResource} inResource={playItem} />
      </Grid>
      <StyledGrid item xs={10}>
        <MediaPlayer
          srcMediaId={playItem}
          requestPlay={itemPlaying}
          onTogglePlay={handleItemTogglePlay}
          onEnded={handleEnded}
          onDuration={handleDuration}
          onPosition={handlePosition}
          position={mediaPosition.current}
          controls={true}
        />
      </StyledGrid>
    </Grid>
  );
}

export default TeamCheckReference;
