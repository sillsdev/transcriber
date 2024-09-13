import { memo, FC, useEffect, useState, useContext } from 'react';
import { IPlanActionsStrings, IMediaShare, ProjectD } from '../../model';
import PlayIcon from '@mui/icons-material/PlayArrowOutlined';
import PauseIcon from '@mui/icons-material/Pause';
import SharedCheckbox from '@mui/icons-material/CheckBoxOutlined';
import NotSharedCheckbox from '@mui/icons-material/CheckBoxOutlineBlankOutlined';
import VersionsIcon from '@mui/icons-material/List';
import { shallowEqual, useSelector } from 'react-redux';
import { IconButton, Box, IconButtonProps, styled, alpha } from '@mui/material';
import { planActionsSelector } from '../../selector';
import EditIcon from '@mui/icons-material/EditOutlined';
import { useGlobal } from 'reactn';
import { findRecord } from '../../crud/tryFindRecord';
import { PlanContext } from '../../context/PlanContext';

// see: https://mui.com/material-ui/customization/how-to-customize/
interface StyledIconButtonProps extends IconButtonProps {
  shared?: IMediaShare;
}
const StyledIconButton = styled(IconButton, {
  shouldForwardProp: (prop) => prop !== 'shared',
})<StyledIconButtonProps>(({ shared, theme }) => ({
  ...(shared === IMediaShare.OldVersionOnly
    ? {
        color: alpha('#8f9a27', 0.6),
      }
    : shared === IMediaShare.Latest
    ? {
        color: 'green',
      }
    : shared === IMediaShare.None
    ? {
        color: 'red',
      }
    : {
        color: theme.palette.primary.light,
      }),
}));

interface IProps {
  rowIndex: number;
  isPassage: boolean;
  publishStatus?: string;
  isNote: boolean;
  mediaId: string;
  mediaShared: IMediaShare;
  isPlaying: boolean;
  canPlay: boolean;
  canEdit: boolean;
  onPlayStatus: (mediaId: string) => void;
  onHistory: (i: number) => () => void;
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
    publishStatus,
    isNote,
    mediaShared,
    shared,
    onHistory,
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
        <StyledIconButton
          id={isNote ? 'noteEdit' : 'passageShare'}
          shared={mediaShared}
          title={
            isNote
              ? t.noteDetails
              : mediaShared !== IMediaShare.NotPublic
              ? t.resourceEdit
              : t.versions
          }
          disabled={!canEdit}
          onClick={onHistory(rowIndex)}
        >
          {shared && publishStatus ? (
            <>{publishStatus}</>
          ) : isNote ? (
            <EditIcon />
          ) : mediaShared === IMediaShare.NotPublic ? (
            <VersionsIcon />
          ) : mediaShared === IMediaShare.None ? (
            <NotSharedCheckbox />
          ) : (
            <SharedCheckbox />
          )}
        </StyledIconButton>
      )}
      {isPassage && (
        <StyledIconButton
          id="planAudPlayStop"
          title={t.playpause}
          disabled={!canPlay}
          onClick={handlePlayStatus()}
        >
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </StyledIconButton>
      )}
    </Box>
  );
});

export function PlanAudioActions(props: IProps) {
  const [projectId] = useGlobal('project');
  const [memory] = useGlobal('memory');
  const [shared, setShared] = useState(false);
  const { hidePublishing } = useContext(PlanContext).state;
  const t: IPlanActionsStrings = useSelector(planActionsSelector, shallowEqual);

  useEffect(() => {
    const projRec = findRecord(memory, 'project', projectId) as ProjectD;
    if (projRec) {
      setShared(projRec?.attributes?.isPublic);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  return <Actions {...props} t={t} shared={shared || !hidePublishing} />;
}
export default PlanAudioActions;
