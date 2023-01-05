import { useGlobal } from '../../../mods/reactn';
import { IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
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
