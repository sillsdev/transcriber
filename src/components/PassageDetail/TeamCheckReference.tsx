import { useContext, useRef } from 'react';
import { Grid, GridProps, styled } from '@mui/material';
import SelectMyResource from './Internalization/SelectMyResource';
import { MediaPlayer } from '../MediaPlayer';
import { PassageDetailContext } from '../../context/PassageDetailContext';
import { getSegments, NamedRegions } from '../../utils';

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
      <Grid item xs={10} sx={{ m: 1 }}>
        <SelectMyResource onChange={handleResource} />
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
