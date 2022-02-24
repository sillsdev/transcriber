import { IconButton } from '@material-ui/core';
import OpenIcon from '@material-ui/icons/CheckBoxOutlineBlank';
import DoneIcon from '@material-ui/icons/CheckBoxOutlined';
import { SectionResource } from '../../../model';

interface IProps {
  value: boolean;
  id: string;
  res: SectionResource | null;
  cb: (id: string, res: SectionResource | null) => void;
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
