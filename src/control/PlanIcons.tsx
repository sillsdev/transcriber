import {
  faArrowUp,
  faArrowDown,
  faSection,
  faParagraph,
  faPlus,
  faAnglesDown,
  faHashtag,
  faBookOpen,
  faBook,
  faArchway,
  faGlobe,
  faCheck,
} from '@fortawesome/free-solid-svg-icons';
//things I've tried! faFileAudio, faVolumeHigh,
import { faMessage } from '@fortawesome/free-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconButton, IconButtonProps, styled } from '@mui/material';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
const StyledIcon = styled(IconButton)<IconButtonProps>(({ theme }) => ({
  color: theme.palette.primary.light,
}));
export const MovementIcon = (
  <FontAwesomeIcon icon={faArchway} data-testid="move-icon" />
);
export const BookIcon = (
  <FontAwesomeIcon icon={faBook} data-testid="book-icon" />
);
export const AltBookIcon = (
  <FontAwesomeIcon icon={faBookOpen} data-testid="alt-icon" />
);
export const ChapterNumberIcon = (
  <FontAwesomeIcon icon={faHashtag} data-testid="chap-icon" />
);
export const NoteIcon = (
  <FontAwesomeIcon icon={faMessage as IconProp} data-testid="note-icon" />
);

export const PublishIcon = (props: IconButtonProps) => (
  <StyledIcon size="small" {...props}>
    <FontAwesomeIcon icon={faGlobe} />
  </StyledIcon>
);
export const UnPublishIcon = () => (
  <StyledIcon size="small">
    <span className="fa-layers fa-fw fa-sm">
      <FontAwesomeIcon icon={faGlobe} />
      <FontAwesomeIcon
        icon={faCheck}
        transform="grow-3"
        style={{ color: 'Tomato' }}
      />
    </span>
  </StyledIcon>
);

export const AddPublishingIcon = () => (
  <StyledIcon size="small">
    <span className="fa-layers fa-fw fa-sm">
      <FontAwesomeIcon icon={faBook} transform="right-8 shrink-2" />
      <FontAwesomeIcon icon={faPlus} transform="up-4 right-16 shrink-2" />
    </span>
  </StyledIcon>
);

export const AddNoteIcon = () => (
  <StyledIcon size="small">
    <span className="fa-layers fa-fw fa-sm">
      <FontAwesomeIcon icon={faArrowDown} transform="shrink-2" />
      <FontAwesomeIcon
        icon={faMessage as IconProp}
        transform="right-10 shrink-4"
      />
      <FontAwesomeIcon icon={faPlus} transform="shrink-4 up-4 right-16" />
    </span>
  </StyledIcon>
);
export const InsertMovementIcon = () => (
  <StyledIcon size="small">
    <span className="fa-layers fa-fw fa-sm">
      <FontAwesomeIcon icon={faArrowUp} />
      <FontAwesomeIcon icon={faArchway} transform="right-10 shrink-2" />
      <FontAwesomeIcon icon={faPlus} transform="up-4 right-20 shrink-2" />
    </span>
  </StyledIcon>
);
export const InsertSectionIcon = () => (
  <StyledIcon size="small">
    <span className="fa-layers fa-fw fa-sm">
      <FontAwesomeIcon icon={faArrowUp} />
      <FontAwesomeIcon icon={faSection} transform="right-8 shrink-2" />
      <FontAwesomeIcon icon={faPlus} transform="up-4 right-16 shrink-2" />
    </span>
  </StyledIcon>
);
export const SectionEndIcon = () => (
  <StyledIcon size="small">
    <span className="fa-layers fa-fw fa-sm">
      <FontAwesomeIcon icon={faAnglesDown} transform="shrink-2" />
      <FontAwesomeIcon icon={faSection} transform="right-12 shrink-2" />
      <FontAwesomeIcon icon={faPlus} transform="up-4 right-20 shrink-2" />
    </span>
  </StyledIcon>
);
export const PassageBelowIcon = () => (
  <StyledIcon size="small">
    <span className="fa-layers fa-fw fa-sm">
      <FontAwesomeIcon icon={faArrowDown} transform="shrink-2" />
      <FontAwesomeIcon icon={faParagraph} transform="right-8 shrink-2" />
      <FontAwesomeIcon icon={faPlus} transform="shrink-4 up-4 right-16" />
    </span>
  </StyledIcon>
);
export const PassageEndIcon = () => (
  <StyledIcon size="small">
    <span className="fa-layers fa-fw fa-sm">
      <FontAwesomeIcon icon={faAnglesDown} transform="shrink-2" />
      <FontAwesomeIcon icon={faParagraph} transform="right-12 shrink-2" />
      <FontAwesomeIcon icon={faPlus} transform="up-4 right-20 shrink-2" />
    </span>
  </StyledIcon>
);
export const MoveUpIcon = () => (
  <StyledIcon size="small">
    <FontAwesomeIcon icon={faArrowUp} transform="shrink-2" />
  </StyledIcon>
);
export const MoveDownIcon = () => (
  <StyledIcon size="small">
    <FontAwesomeIcon icon={faArrowDown} transform="shrink-2" />
  </StyledIcon>
);
// export const PassageToPrevIcon = () => (
//   <StyledIcon size="small">
//     <span className="fa-layers fa-fw fa-sm">
//       <FontAwesomeIcon icon={faArrowTurnUp} transform="shrink-2" />
//       <FontAwesomeIcon icon={faParagraph} transform="right-8 shrink-2" />
//     </span>
//   </StyledIcon>
// );
// export const PassageToNextIcon = () => (
//   <StyledIcon size="small">
//     <span className="fa-layers fa-fw fa-sm">
//       <FontAwesomeIcon icon={faArrowTurnDown} transform="shrink-2" />
//       <FontAwesomeIcon icon={faParagraph} transform="right-8 shrink-2" />
//     </span>
//   </StyledIcon>
// );
