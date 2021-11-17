import { IconButton } from '@material-ui/core';
import OpenIcon from '@material-ui/icons/CheckBoxOutlineBlank';
import DoneIcon from '@material-ui/icons/CheckBoxOutlined';

interface IProps {
  value: boolean;
  id: string;
  cb: (id: string) => void;
}

const handleDone =
  ({ id, cb }: IProps) =>
  () => {
    cb(id);
  };

export const DoneButton = (props: IProps) => (
  <IconButton onClick={handleDone(props)}>
    {props.value ? <DoneIcon /> : <OpenIcon />}
  </IconButton>
);
