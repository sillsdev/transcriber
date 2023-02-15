import { Chip, IconButton } from '@mui/material';
import PlayIcon from '@mui/icons-material/PlayArrow';

interface IProps {
  label: string;
  onPlay?: () => void;
  onClick: () => void;
  onDelete: () => void;
}
export const KeyTermChip = ({ label, onPlay, onClick, onDelete }: IProps) => {
  return (
    <Chip
      icon={
        onPlay && (
          <IconButton onClick={onPlay}>
            <PlayIcon fontSize="small" />
          </IconButton>
        )
      }
      label={label}
      onClick={onClick}
      onDelete={onDelete}
      size="small"
      sx={{ mr: 1, mb: 1 }}
    />
  );
};

export default KeyTermChip;
