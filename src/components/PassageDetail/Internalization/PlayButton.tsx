import { IconButton } from '@material-ui/core';
import PlayIcon from '@material-ui/icons/PlayArrow';
import PauseIcon from '@material-ui/icons/Pause';

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

export const PlayButton = (props: IProps) => (
  <IconButton onClick={handlePlay(props)}>
    {props.value ? <PlayIcon /> : <PauseIcon />}
  </IconButton>
);
