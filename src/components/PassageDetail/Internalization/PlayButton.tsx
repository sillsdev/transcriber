import { IconButton } from '@material-ui/core';
import PlayIcon from '@material-ui/icons/PlayArrow';
import PauseIcon from '@material-ui/icons/Pause';
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
