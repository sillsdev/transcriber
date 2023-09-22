import { useMemo, memo, FC } from 'react';
import { IPlanActionsStrings, IMediaShare } from '../../model';
import PlayIcon from '@mui/icons-material/PlayArrowOutlined';
import PauseIcon from '@mui/icons-material/Pause';
import SettingIcon from '@mui/icons-material/Settings';
import SharedCheckbox from '@mui/icons-material/CheckBoxOutlined';
import NotSharedCheckbox from '@mui/icons-material/CheckBoxOutlineBlankOutlined';
import VersionsIcon from '@mui/icons-material/List';
import { shallowEqual, useSelector } from 'react-redux';
import { IconButton, Box, IconButtonProps, styled } from '@mui/material';
import { planActionsSelector } from '../../selector';

// see: https://mui.com/material-ui/customization/how-to-customize/
interface StyledIconButtonProps extends IconButtonProps {
  shared?: boolean;
}
const StyledIconButton = styled(IconButton, {
  shouldForwardProp: (prop) => prop !== 'shared',
})<StyledIconButtonProps>(({ shared, theme }) => ({
  ...(shared
    ? {
        color: theme.palette.secondary.light,
      }
    : {
        color: theme.palette.primary.light,
      }),
}));

interface IProps {
  rowIndex: number;
  isPassage: boolean;
  isNote: boolean;
  mediaId: string;
  mediaShared: IMediaShare;
  isPlaying: boolean;
  onPlayStatus: (mediaId: string) => void;
  onHistory: (i: number) => () => void;
}

interface FcProps extends IProps {
  disabled: boolean;
  t: IPlanActionsStrings;
}

const Actions: FC<FcProps> = memo((props: FcProps) => {
  const {
    rowIndex,
    isPassage,
    isNote,
    mediaShared,
    onHistory,
    onPlayStatus,
    mediaId,
    isPlaying,
    disabled,
    t,
  } = props;

  const handlePlayStatus = () => () => {
    onPlayStatus(mediaId);
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
      {isPassage && (
        <StyledIconButton
          id="passageShare"
          shared={mediaShared === IMediaShare.OldVersionOnly}
          title={
            mediaShared !== IMediaShare.NotPublic ? t.resourceEdit : t.versions
          }
          disabled={disabled && !isNote}
          onClick={onHistory(rowIndex)}
        >
          {isNote ? (
            <SettingIcon />
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
          disabled={disabled}
          onClick={handlePlayStatus()}
        >
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </StyledIconButton>
      )}
    </Box>
  );
});

export function PlanAudioActions(props: IProps) {
  const { mediaId } = props;
  const t: IPlanActionsStrings = useSelector(planActionsSelector, shallowEqual);

  const disabled = useMemo(() => {
    return (mediaId || '') === '';
  }, [mediaId]);

  return <Actions {...props} disabled={disabled} t={t} />;
}
export default PlanAudioActions;
