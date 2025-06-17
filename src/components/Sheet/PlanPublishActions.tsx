import { memo, FC, useContext } from 'react';
import { IPlanActionsStrings, IMediaShare } from '../../model';
import SharedCheckbox from '@mui/icons-material/CheckBoxOutlined';
import NotSharedCheckbox from '@mui/icons-material/CheckBoxOutlineBlankOutlined';
import VersionsIcon from '@mui/icons-material/List';
import { shallowEqual, useSelector } from 'react-redux';
import { IconButton, Box, IconButtonProps, styled, alpha } from '@mui/material';
import { planActionsSelector } from '../../selector';
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
  mediaId: string;
  mediaShared?: IMediaShare;
  canEdit: boolean;
  onHistory: (i: number) => () => void;
}

interface FcProps extends IProps {
  canEdit: boolean;
  shared: boolean;
  t: IPlanActionsStrings;
}

const Actions: FC<FcProps> = memo((props: FcProps) => {
  const {
    rowIndex,
    isPassage,
    publishStatus,
    mediaShared,
    shared,
    onHistory,
    canEdit,
    t,
  } = props;

  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
      {isPassage && (
        <StyledIconButton
          id="passageShare"
          shared={mediaShared}
          title={t.versions}
          disabled={!canEdit}
          onClick={onHistory(rowIndex)}
        >
          {shared && publishStatus ? (
            <>{publishStatus}</>
          ) : mediaShared === IMediaShare.NotPublic ? (
            <VersionsIcon />
          ) : mediaShared === IMediaShare.None ? (
            <NotSharedCheckbox />
          ) : (
            <SharedCheckbox />
          )}
        </StyledIconButton>
      )}
    </Box>
  );
});

export function PlanPublishActions(props: IProps) {
  const { shared, hidePublishing } = useContext(PlanContext).state;
  const t: IPlanActionsStrings = useSelector(planActionsSelector, shallowEqual);
  return <Actions {...props} t={t} shared={shared || !hidePublishing} />;
}
export default PlanPublishActions;
