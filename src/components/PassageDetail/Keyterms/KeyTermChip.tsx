import { Chip, IconButton, Tooltip } from '@mui/material';
import PlayIcon from '@mui/icons-material/PlayArrow';
import { shallowEqual, useSelector } from 'react-redux';
import { keyTermsSelector } from '../../../selector';
import { IKeyTermsStrings } from '../../../model';

interface IProps {
  label: string;
  playerOpen?: boolean;
  onPlay?: () => void;
  onClick: () => void;
  onDelete: () => void;
}
export const KeyTermChip = ({
  label,
  playerOpen,
  onPlay,
  onClick,
  onDelete,
}: IProps) => {
  const t: IKeyTermsStrings = useSelector(keyTermsSelector, shallowEqual);

  return (
    <Chip
      icon={
        onPlay && !playerOpen ? (
          <Tooltip title={t.play}>
            <IconButton onClick={onPlay}>
              <PlayIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        ) : undefined
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
