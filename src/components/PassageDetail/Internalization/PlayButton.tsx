import { IconButton } from '@mui/material';
import PlayIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import { LightTooltip } from '../../StepEditor';
import { IMediaActionsStrings } from '../../../model';
import { mediaActionsSelector } from '../../../selector';
import { shallowEqual, useSelector } from 'react-redux';

interface IProps {
  value: boolean;
  id: string;
  cb: (id: string) => void;
}

const handlePlay =
  ({ id, cb }: IProps) =>
  () => {
    cb(id);
  };

export const PlayButton = (props: IProps) => {
  const t: IMediaActionsStrings = useSelector(
    mediaActionsSelector,
    shallowEqual
  );

  return (
    <LightTooltip title={props.value ? t.play : t.pause}>
      <span>
        <IconButton id="res-play-pause" onClick={handlePlay(props)}>
          {props.value ? <PlayIcon /> : <PauseIcon />}
        </IconButton>
      </span>
    </LightTooltip>
  );
};
