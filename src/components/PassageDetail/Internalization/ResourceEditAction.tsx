import { useGlobal } from 'reactn';
import { IconButton } from '@material-ui/core';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import { LightTooltip } from '../../StepEditor';
import { IMediaActionsStrings } from '../../../model';
import { mediaActionsSelector } from '../../../selector';
import { shallowEqual, useSelector } from 'react-redux';

interface IProps {
  item: string;
  onEdit?: (item: string) => void;
  onDelete?: (item: string) => void;
}

export const ResourceEditAction = ({ item, onEdit, onDelete }: IProps) => {
  const [isOffline] = useGlobal('offline');
  const [offlineOnly] = useGlobal('offlineOnly');
  const t: IMediaActionsStrings = useSelector(
    mediaActionsSelector,
    shallowEqual
  );

  const handleEdit = (item: string) => () => {
    onEdit && onEdit(item);
  };

  const handleDelete = (item: string) => () => {
    onDelete && onDelete(item);
  };

  return !isOffline || offlineOnly ? (
    <span>
      {onEdit && (
        <LightTooltip title={t.edit}>
          <span>
            <IconButton id={`res-edit`} onClick={handleEdit(item)}>
              <EditIcon />
            </IconButton>
          </span>
        </LightTooltip>
      )}
      <LightTooltip title={t.delete}>
        <span>
          <IconButton id={`res-delete`} onClick={handleDelete(item)}>
            <DeleteIcon />
          </IconButton>
        </span>
      </LightTooltip>
    </span>
  ) : (
    <></>
  );
};
