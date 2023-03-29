import { Chip, IconButton } from '@mui/material';
import { LightTooltip } from './LightTooltip';
import PlayIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import { useContext, useMemo } from 'react';
import { startEnd } from '../utils';
import { PassageDetailContext } from '../context/PassageDetailContext';
import { commentCardSelector } from '../selector';
import { shallowEqual, useSelector } from 'react-redux';
import { ICommentCardStrings } from '../model';

interface IProps {
  id: string;
  oldVernVer?: number;
  mediaId: string;
  text: string;
}

export function OldVernVersion({ id, oldVernVer, mediaId, text }: IProps) {
  const {
    oldVernacularPlayItem,
    oldVernacularPlaying,
    oldVernacularStart,
    handleOldVernacularPlayEnd,
    setMediaSelected,
  } = useContext(PassageDetailContext).state;
  const t: ICommentCardStrings = useSelector(commentCardSelector, shallowEqual);

  const myRegion = useMemo(() => {
    return startEnd(text);
  }, [text]);

  const handlePlayOldClip = (mediaId: string) => () => {
    if (oldVernacularPlaying) {
      handleOldVernacularPlayEnd();
    } else {
      setMediaSelected(mediaId, myRegion?.start || 0, myRegion?.end || 0);
    }
  };

  return oldVernVer ? (
    <>
      {oldVernVer && (
        <LightTooltip title={t.previousVersion}>
          <Chip label={oldVernVer.toString()} size="small" />
        </LightTooltip>
      )}
      <LightTooltip title={t.playOrStop}>
        <IconButton
          id={`play-${id}`}
          size="small"
          onClick={handlePlayOldClip(mediaId)}
          sx={{ p: '3px', m: '5px' }}
        >
          {oldVernacularPlayItem === mediaId &&
          oldVernacularStart === myRegion?.start ? (
            <StopIcon fontSize="small" />
          ) : (
            <PlayIcon fontSize="small" />
          )}
        </IconButton>
      </LightTooltip>
    </>
  ) : (
    <></>
  );
}
