import HideIcon from '@mui/icons-material/VisibilityOff';
import ShowIcon from '@mui/icons-material/Visibility';
import { IconButton } from '@mui/material';

interface IProps {
  hide: boolean;
  onChange: () => void;
}

export const KeyTermVisible = ({ hide, onChange }: IProps) => {
  return (
    <IconButton aria-label="change visibility" onClick={onChange} edge="end">
      {hide ? <HideIcon fontSize="small" /> : <ShowIcon fontSize="small" />}
    </IconButton>
  );
};

export default KeyTermVisible;
