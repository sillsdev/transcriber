import { memo, FC, useContext } from 'react';
import { IPlanActionsStrings } from '../../model';
import PlayIcon from '@mui/icons-material/PlayArrowOutlined';
import PauseIcon from '@mui/icons-material/Pause';
import { shallowEqual, useSelector } from 'react-redux';
import { IconButton, Box } from '@mui/material';
import { planActionsSelector } from '../../selector';
import EditIcon from '@mui/icons-material/EditOutlined';
import { PlanContext } from '../../context/PlanContext';

// see: https://mui.com/material-ui/customization/how-to-customize/
interface IProps {
  rowIndex: number;
  isPassage: boolean;
  isNote: boolean;
  mediaId: string;
  isPlaying: boolean;
  canPlay: boolean;
  canEdit: boolean;
  onPlayStatus: (mediaId: string) => void;
  onEdit?: (i: number) => () => void;
}

interface FcProps extends IProps {
  canPlay: boolean;
  canEdit: boolean;
  shared: boolean;
  t: IPlanActionsStrings;
}

const Actions: FC<FcProps> = memo((props: FcProps) => {
  const {
    rowIndex,
    isPassage,
    isNote,
    onEdit,
    shared,
    onPlayStatus,
    mediaId,
    isPlaying,
    canEdit,
    canPlay,
    t,
  } = props;

  const handlePlayStatus = () => () => {
    onPlayStatus(mediaId);
  };
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
      {isPassage && (
        <IconButton
          id="planAudPlayStop"
          title={t.playpause}
          disabled={!canPlay}
          sx={{ color: 'primary.light' }}
          onClick={handlePlayStatus()}
        >
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </IconButton>
      )}
      {isPassage && (shared || isNote) && onEdit && (
        <IconButton
          id="noteEdit"
          title={t.noteDetails}
          disabled={!canEdit}
          onClick={onEdit(rowIndex)}
        >
          <EditIcon />
        </IconButton>
      )}
    </Box>
  );
});

export function PlanAudioActions(props: IProps) {
  const { shared, hidePublishing } = useContext(PlanContext).state;
  const t: IPlanActionsStrings = useSelector(planActionsSelector, shallowEqual);
  return <Actions {...props} t={t} shared={shared || !hidePublishing} />;
}
export default PlanAudioActions;
