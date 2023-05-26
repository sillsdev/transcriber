import { useContext, useEffect, useRef, useState } from 'react';
import { Grid, GridProps, IconButton, Stack, styled } from '@mui/material';
import ReplayIcon from '@mui/icons-material/Replay';
import SkipPrevious from '@mui/icons-material/SkipPrevious';
import SkipNext from '@mui/icons-material/SkipNext';
import SelectMyResource from './Internalization/SelectMyResource';
import { MediaPlayer } from '../MediaPlayer';
import { PassageDetailContext } from '../../context/PassageDetailContext';
import { getSegments, LocalKey, localUserKey, NamedRegions } from '../../utils';
import { LightTooltip } from '../StepEditor';
import { IPeerCheckStrings } from '../../model';
import { shallowEqual, useSelector } from 'react-redux';
import { peerCheckSelector } from '../../selector';

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
    section,
    passage,
    currentstep,
  } = ctx.state;
  const [start, setStart] = useState<number>(0); // used to skip previous
  const [end, setEnd] = useState<number>(0); // used to skip ahead
  const [duration, setDuration] = useState<number>(0);
  const mediaStart = useRef<number | undefined>();
  const mediaEnd = useRef<number | undefined>();
  const mediaPosition = useRef<number | undefined>();
  const mediaCurrent = useRef<number>();
  const [resource, setResource] = useState('');
  const t: IPeerCheckStrings = useSelector(peerCheckSelector, shallowEqual);

  const storeKey = (keyType?: string) =>
    `${localUserKey(LocalKey.compare)}_${
      keyType ?? passage.attributes.sequencenum
    }`;

  const SecSlug = 'secId';

  const handleResource = (id: string) => {
    const row = rowData.find((r) => r.id === id);
    if (row) {
      const secId = localStorage.getItem(storeKey(SecSlug));
      if (secId !== section.id) {
        localStorage.setItem(storeKey(SecSlug), section.id);
        let n = 1;
        while (true) {
          const res = localStorage.getItem(storeKey(n.toString()));
          if (!res) break;
          localStorage.removeItem(storeKey(n.toString()));
          n += 1;
        }
      }
      localStorage.setItem(storeKey(), id);
      const segs = getSegments(
        NamedRegions.ProjectResource,
        row.mediafile.attributes.segments
      );
      const regions = JSON.parse(segs);
      if (regions.length > 0) {
        const { start, end } = regions[0];
        mediaStart.current = start;
        mediaEnd.current = end;
        setStart(start);
        setEnd(end);
        setMediaSelected(id, start, end);
        return;
      }
    }
    setPlayItem(id);
  };

  const handleEnded = () => {
    mediaStart.current = start;
    // mediaEnd.current = undefined;
    mediaPosition.current = start;
    handleItemPlayEnd();
  };

  const handleDuration = (duration: number) => {
    mediaPosition.current = mediaStart.current ?? 0;
    mediaStart.current = undefined;
    setDuration(duration);
    setItemPlaying(true);
  };

  const handlePosition = (position: number) => {
    mediaCurrent.current = position;
    if (mediaEnd.current && position >= mediaEnd.current) {
      handleEnded();
    }
  };

  useEffect(() => {
    setPlayItem('');
    // We track the user's choices for each passage of the section
    const res = localStorage.getItem(storeKey());
    const secId = localStorage.getItem(storeKey(SecSlug));
    if (res && secId === section.id) {
      setResource(res);
      handleResource(res);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section, passage, currentstep]);

  const handleSegmentStart = () => {
    mediaPosition.current = start;
    mediaEnd.current = end;
    setMediaSelected(
      playItem,
      mediaPosition.current,
      mediaEnd.current ?? duration
    );
    setItemPlaying(true);
  };

  const handleSkipBack = () => {
    setItemPlaying(false);
    mediaPosition.current = Math.max((mediaCurrent.current ?? 0) - 3.0, 0);
    setMediaSelected(
      playItem,
      mediaPosition.current,
      mediaEnd.current ?? duration
    );
    setItemPlaying(true);
  };

  const handleSkipNext = () => {
    setItemPlaying(false);
    mediaPosition.current = mediaEnd.current ?? duration;
    mediaEnd.current = duration;
    setMediaSelected(
      playItem,
      mediaPosition.current,
      mediaEnd.current ?? duration
    );
    setItemPlaying(true);
  };

  return (
    <Grid container direction="column">
      <Grid item xs={10} sx={{ m: 2, p: 2 }}>
        <SelectMyResource onChange={handleResource} inResource={resource} />
      </Grid>
      <Stack direction="row">
        {Boolean(mediaEnd.current) && (
          <LightTooltip title={t.resourceStart}>
            <IconButton
              sx={{ height: '54px', alignSelf: 'center' }}
              onClick={handleSegmentStart}
            >
              <SkipPrevious fontSize="small" />
            </IconButton>
          </LightTooltip>
        )}
        <LightTooltip title={t.back3Seconds}>
          <IconButton
            sx={{ height: '54px', alignSelf: 'center' }}
            onClick={handleSkipBack}
          >
            <ReplayIcon fontSize="small" />
          </IconButton>
        </LightTooltip>
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
        {mediaEnd.current && mediaEnd.current < duration && (
          <LightTooltip title={t.afterResource}>
            <IconButton
              sx={{ height: '54px', alignSelf: 'center' }}
              onClick={handleSkipNext}
            >
              <SkipNext fontSize="small" />
            </IconButton>
          </LightTooltip>
        )}
      </Stack>
    </Grid>
  );
}

export default TeamCheckReference;
