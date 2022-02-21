import { IconButton } from '@material-ui/core';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';

interface IProps {
  item: string;
  onEdit?: (item: string) => void;
  onDelete?: (item: string) => void;
}

export const ResourceEditAction = ({ item, onEdit, onDelete }: IProps) => {
  const handleEdit = (item: string) => () => {
    onEdit && onEdit(item);
  };

  const handleDelete = (item: string) => () => {
    onDelete && onDelete(item);
  };

  return (
    <span>
      {onEdit && (
        <IconButton onClick={handleEdit(item)}>
          <EditIcon />
        </IconButton>
      )}
      <IconButton onClick={handleDelete(item)}>
        <DeleteIcon />
      </IconButton>
    </span>
  );
};
