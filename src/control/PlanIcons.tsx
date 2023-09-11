import {
  faArrowUp,
  faArrowDown,
  faSection,
  faParagraph,
  faPlus,
  faArrowTurnUp,
  faArrowTurnDown,
  faAnglesDown,
  faHashtag,
  faBookOpen,
  faBook,
  faBookmark,
  faArchway,
} from '@fortawesome/free-solid-svg-icons';
//things I've tried! faFileAudio, faVolumeHigh,
import { faMessage } from '@fortawesome/free-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconButton, IconButtonProps, styled } from '@mui/material';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
const StyledIcon = styled(IconButton)<IconButtonProps>(({ theme }) => ({
  color: theme.palette.primary.light,
}));
export const MovementIcon = <FontAwesomeIcon icon={faArchway} />;
export const BookIcon = <FontAwesomeIcon icon={faBook} />;
export const AltBookIcon = <FontAwesomeIcon icon={faBookOpen} />;
export const ChapterNumberIcon = <FontAwesomeIcon icon={faHashtag} />;
export const NoteIcon = <FontAwesomeIcon icon={faMessage as IconProp} />;
export const TitleIcon = <FontAwesomeIcon icon={faBookmark} />;

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
        transform="right-10 shrink-2"
      />
      <FontAwesomeIcon icon={faPlus} transform="shrink-4 up-4 right-16" />
    </span>
  </StyledIcon>
);
/* MAYBE WE'LL NEED THIS?
export const AddChapterNumberIcon = () => (
  <StyledIcon size="small">
    <span className="fa-layers fa-fw fa-sm">
      <FontAwesomeIcon icon={faArrowDown} transform="shrink-2" />
      <FontAwesomeIcon icon={faHashtag} transform="right-8 shrink-2" />
      <FontAwesomeIcon icon={faPlus} transform="shrink-4 up-4 right-16" />
    </span>
  </StyledIcon>
); */
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
export const PassageUpIcon = () => (
  <StyledIcon size="small">
    <FontAwesomeIcon icon={faArrowUp} transform="shrink-2" />
  </StyledIcon>
);
export const PassageDownIcon = () => (
  <StyledIcon size="small">
    <FontAwesomeIcon icon={faArrowDown} transform="shrink-2" />
  </StyledIcon>
);
export const PassageToPrevIcon = () => (
  <StyledIcon size="small">
    <span className="fa-layers fa-fw fa-sm">
      <FontAwesomeIcon icon={faArrowTurnUp} transform="shrink-2" />
      <FontAwesomeIcon icon={faParagraph} transform="right-8 shrink-2" />
    </span>
  </StyledIcon>
);
export const PassageToNextIcon = () => (
  <StyledIcon size="small">
    <span className="fa-layers fa-fw fa-sm">
      <FontAwesomeIcon icon={faArrowTurnDown} transform="shrink-2" />
      <FontAwesomeIcon icon={faParagraph} transform="right-8 shrink-2" />
    </span>
  </StyledIcon>
);
