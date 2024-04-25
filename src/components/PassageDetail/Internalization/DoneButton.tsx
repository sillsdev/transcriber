import { IconButton } from '@mui/material';
import OpenIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import DoneIcon from '@mui/icons-material/CheckBoxOutlined';
import { SectionResourceD } from '../../../model';

interface IProps {
  value: boolean;
  id: string;
  res: SectionResourceD | null;
  cb: (id: string, res: SectionResourceD | null) => void;
}

const handleDone =
  ({ id, res, cb }: IProps) =>
  () => {
    cb(id, res);
  };

export const DoneButton = (props: IProps) => (
  <IconButton id="item-done" onClick={handleDone(props)}>
    {props.value ? <DoneIcon id="done-yes" /> : <OpenIcon id="done-no" />}
  </IconButton>
);
