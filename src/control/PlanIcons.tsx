import {
  faArrowUp,
  faArrowDown,
  faS,
  faP,
  faPlus,
  faArrowTurnUp,
  faArrowTurnDown,
  faAnglesDown,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconButton, IconButtonProps, styled } from '@mui/material';

const StyledIcon = styled(IconButton)<IconButtonProps>(({ theme }) => ({
  color: theme.palette.primary.light,
}));

export const InsertSectionIcon = () => (
  <StyledIcon size="small">
    <span className="fa-layers fa-fw fa-sm">
      <FontAwesomeIcon icon={faArrowUp} />
      <FontAwesomeIcon icon={faS} transform="right-8 shrink-2" />
      <FontAwesomeIcon icon={faPlus} transform="up-4 right-16 shrink-2" />
    </span>
  </StyledIcon>
);
export const SectionEndIcon = () => (
  <StyledIcon size="small">
    <span className="fa-layers fa-fw fa-sm">
      <FontAwesomeIcon icon={faAnglesDown} transform="shrink-2" />
      <FontAwesomeIcon icon={faS} transform="right-12 shrink-2" />
      <FontAwesomeIcon icon={faPlus} transform="up-4 right-20 shrink-2" />
    </span>
  </StyledIcon>
);
export const PassageBelowIcon = () => (
  <StyledIcon size="small">
    <span className="fa-layers fa-fw fa-sm">
      <FontAwesomeIcon icon={faArrowDown} transform="shrink-2" />
      <FontAwesomeIcon icon={faP} transform="right-8 shrink-2" />
      <FontAwesomeIcon icon={faPlus} transform="shrink-4 up-4 right-16" />
    </span>
  </StyledIcon>
);
export const PassageEndIcon = () => (
  <StyledIcon size="small">
    <span className="fa-layers fa-fw fa-sm">
      <FontAwesomeIcon icon={faAnglesDown} transform="shrink-2" />
      <FontAwesomeIcon icon={faP} transform="right-12 shrink-2" />
      <FontAwesomeIcon icon={faPlus} transform="up-4 right-20 shrink-2" />
    </span>
  </StyledIcon>
);
export const PassageToPrevIcon = () => (
  <StyledIcon size="small">
    <span className="fa-layers fa-fw fa-sm">
      <FontAwesomeIcon icon={faArrowTurnUp} transform="shrink-2" />
      <FontAwesomeIcon icon={faP} transform="right-8 shrink-2" />
    </span>
  </StyledIcon>
);
export const PassageToNextIcon = () => (
  <StyledIcon size="small">
    <span className="fa-layers fa-fw fa-sm">
      <FontAwesomeIcon icon={faArrowTurnDown} transform="shrink-2" />
      <FontAwesomeIcon icon={faP} transform="right-8 shrink-2" />
    </span>
  </StyledIcon>
);
