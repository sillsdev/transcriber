import { useRef, useState, useEffect } from 'react';
import { useGlobal } from 'reactn';
import { useFetchMediaUrl, MediaSt } from '../crud';
import { logError, Severity } from '../utils';
import { useSnackBar } from '../hoc/SnackBar';
import { IPeerCheckStrings, ISharedStrings } from '../model';
import { peerCheckSelector, sharedSelector } from '../selector';
import { shallowEqual, useSelector } from 'react-redux';
import {
  IconButton,
  Stack,
  StackProps,
  SxProps,
  TooltipProps,
  styled,
} from '@mui/material';
import { LightTooltip } from '../control/LightTooltip';
import ReplayIcon from '@mui/icons-material/Replay';
import SkipPrevious from '@mui/icons-material/SkipPrevious';

const StyledTip = styled(LightTooltip)<TooltipProps>(({ theme }) => ({
  backgroundColor: 'transparent',
}));

const StyledStack = styled(Stack)<StackProps>(({ theme }) => ({
  width: '100%',
  '& audio': {
    width: '100%',
  },
}));

interface IProps {
  srcMediaId: string;
  requestPlay: boolean;
  onEnded: () => void;
  onTogglePlay?: () => void;
  controls?: boolean;
  onLoaded?: () => void;
  sx?: SxProps;
}

export function MediaPlayer(props: IProps) {
  const {
    srcMediaId,
    requestPlay,
    onLoaded,
    onEnded,
    onTogglePlay,
    controls,
    sx,
  } = props;
  const [reporter] = useGlobal('errorReporter');
  const { fetchMediaUrl, mediaState } = useFetchMediaUrl(reporter);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playSuccess = useRef(false);
  const [playing, setPlayingx] = useState(false);
  const playingRef = useRef(false);
  const [playItem, setPlayItem] = useState('');
  const [ready, setReady] = useState(false);
  const durationSet = useRef(false);
  const { showMessage } = useSnackBar();
  const ts: ISharedStrings = useSelector(sharedSelector, shallowEqual);
  const t: IPeerCheckStrings = useSelector(peerCheckSelector, shallowEqual);

  const setPlaying = (x: boolean) => {
    setPlayingx(x);
    playingRef.current = x;
  };
  useEffect(() => {
    if (playingRef.current) {
      if (audioRef.current) {
        if (playSuccess.current) audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      stopPlay();
    }
    durationSet.current = false;
    if (srcMediaId !== playItem) {
      setReady(false);
      fetchMediaUrl({ id: srcMediaId });
      setPlayItem(srcMediaId);
    } else {
      durationChange();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [srcMediaId]);

  useEffect(() => {
    if (mediaState.id !== srcMediaId && mediaState.remoteId !== srcMediaId)
      return;
    if (mediaState.status === MediaSt.FETCHED) setReady(true);
    if (mediaState.error) {
      if (mediaState.error.startsWith('no offline file'))
        showMessage(ts.fileNotFound);
      else showMessage(mediaState.error);
      onEnded();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaState]);

  useEffect(() => {
    stopPlay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playItem]);

  useEffect(() => {
    if (ready && audioRef.current && playItem !== '' && requestPlay) {
      startPlay();
    } else if (!requestPlay) {
      if (playingRef.current) {
        if (audioRef.current && playSuccess.current) audioRef.current.pause();
        stopPlay();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, requestPlay, playing, playItem]);

  const setPosition = (position: number | undefined) => {
    if (
      audioRef.current &&
      position !== undefined &&
      position !== audioRef.current.currentTime
    ) {
      audioRef.current.currentTime = position;
    }
  };

  const ended = () => {
    if (audioRef.current) audioRef.current.currentTime = 0;
    stopPlay();
    if (onEnded) onEnded();
  };

  const pause = () => {
    toggle(false);
  };
  const play = () => {
    toggle(true);
  };
  const toggle = (play: boolean) => {
    if (play !== playingRef.current && onTogglePlay) onTogglePlay();
  };

  const durationChange = () => {
    //this is called multiple times for some files
    const el = audioRef.current as HTMLMediaElement;
    if (!durationSet.current && el?.duration) {
      durationSet.current = true;
      onLoaded && onLoaded();
    }
  };

  const handleError = (e: any) => {
    logError(Severity.error, reporter, e);
    // showMessage(e.target?.error?.message || ts.mediaError);
    showMessage(ts.mediaError);
  };

  const handleSegmentStart = () => {
    setPosition(0);
  };

  const handleSkipBack = () => {
    if (audioRef.current)
      setPosition(Math.max(audioRef.current?.currentTime - 3, 0));
  };

  const startPlay = () => {
    if (playing || playSuccess.current) return;
    setPlaying(true);
    playSuccess.current = false;
    if (audioRef.current) {
      audioRef.current
        .play()
        .then(() => {
          if (audioRef.current) playSuccess.current = true;
        })
        .catch(() => {
          playSuccess.current = false;
        });
    }
  };
  const stopPlay = () => {
    setPlaying(false);
    playSuccess.current = false;
  };

  return ready ? (
    <StyledStack direction="row" sx={{ ...sx }}>
      {controls && (
        <>
          <StyledTip title={t.resourceStart}>
            <IconButton
              data-testid="segment-start"
              sx={{ alignSelf: 'center' }}
              onClick={handleSegmentStart}
            >
              <SkipPrevious fontSize="small" />
            </IconButton>
          </StyledTip>
          <StyledTip title={t.back3Seconds}>
            <IconButton
              data-testid="skip-back"
              sx={{ alignSelf: 'center' }}
              onClick={handleSkipBack}
            >
              <ReplayIcon fontSize="small" />
            </IconButton>
          </StyledTip>
        </>
      )}
      <audio
        controls={controls}
        onEnded={ended}
        ref={audioRef}
        src={mediaState.url}
        onDurationChange={durationChange}
        onError={handleError}
        onPause={pause}
        onPlay={play}
      />
    </StyledStack>
  ) : (
    <></>
  );
}
export default MediaPlayer;
