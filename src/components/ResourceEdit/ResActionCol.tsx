import Delete from '@mui/icons-material/Delete';
import { IconButton, Stack } from '@mui/material';

interface ActionColProps {
  row: number;
  onDelete: (val: number) => void;
}

export default function ResActionCol({ row, onDelete }: ActionColProps) {
  const handleDelete = (row: number) => () => onDelete(row);

  return (
    <Stack direction="row" sx={{ alignItems: 'center' }}>
      <IconButton onClick={handleDelete(row)}>
        <Delete fontSize="small" />
      </IconButton>
    </Stack>
  );
}
