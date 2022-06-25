import { IconButton } from '@material-ui/core';
import ShowIcon from '@material-ui/icons/Visibility';
import { LightTooltip } from '../../StepEditor';
import { IMediaActionsStrings } from '../../../model';
import { mediaActionsSelector } from '../../../selector';
import { shallowEqual, useSelector } from 'react-redux';

interface IProps {
  id: string;
  cb: (id: string) => void;
}

const handleView =
  ({ id, cb }: IProps) =>
  () => {
    cb(id);
  };

export const ViewButton = (props: IProps) => {
  const t: IMediaActionsStrings = useSelector(
    mediaActionsSelector,
    shallowEqual
  );
  return (
    <LightTooltip title={t.view}>
      <span>
        <IconButton id="res-view" onClick={handleView(props)}>
          <ShowIcon fontSize="small" />
        </IconButton>
      </span>
    </LightTooltip>
  );
};
