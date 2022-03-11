import { IconButton } from '@material-ui/core';
import ShowIcon from '@material-ui/icons/Visibility';

interface IProps {
  id: string;
  cb: (id: string) => void;
}

const handleView =
  ({ id, cb }: IProps) =>
  () => {
    cb(id);
  };

export const ViewButton = (props: IProps) => (
  <IconButton onClick={handleView(props)}>
    <ShowIcon fontSize="small" />
  </IconButton>
);
