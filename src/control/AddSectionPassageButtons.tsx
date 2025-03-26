import React, { useState } from 'react';
import { IPlanSheetStrings } from '../model';
import {
  ListItemIcon,
  ListItemIconProps,
  Menu,
  MenuItem,
  styled,
} from '@mui/material';
import DropDownIcon from '@mui/icons-material/ArrowDropDown';
import { iconMargin, AltButton } from '../control';
import { useOrganizedBy } from '../crud';
import { planSheetSelector } from '../selector';
import { shallowEqual, useSelector } from 'react-redux';
import {
  AddNoteIcon,
  AddPublishingIcon,
  InsertMovementIcon,
  InsertSectionIcon,
  PassageBelowIcon,
  PassageEndIcon,
  SectionEndIcon,
} from './PlanIcons';
import { ExtraIcon } from '../components/Sheet';
import { useCanPublish } from '../utils';

const StyledMenuIcon = styled(ListItemIcon)<ListItemIconProps>(({ theme }) => ({
  paddingRight: theme.spacing(2),
}));

interface IProps {
  canEditSheet: boolean;
  readonly: boolean;
  inlinePassages: boolean;
  numRows: number;
  mouseposition: {
    mouseX: null | number;
    mouseY: null | number;
    i: number;
    j: number;
  };
  sectionSequenceNumber: string;
  passageSequenceNumber: string;
  onDisableFilter?: () => void;
  isSection: boolean;
  isPassage: boolean;
  handleNoContextMenu: () => void;
  showIcon: (icon: ExtraIcon) => boolean;
  onAction: (what: ExtraIcon) => void;
}

export const AddSectionPassageButtons = (props: IProps) => {
  const {
    canEditSheet,
    readonly,
    inlinePassages,
    numRows,
    sectionSequenceNumber,
    passageSequenceNumber,
    onDisableFilter,
    isSection,
    isPassage,
    handleNoContextMenu,
    showIcon,
    onAction,
  } = props;
  const [actionMenuItem, setActionMenuItem] = React.useState<any>(undefined);
  const { getOrganizedBy } = useOrganizedBy();
  const [organizedBy] = useState(getOrganizedBy(true));
  const { canAddPublishing } = useCanPublish();
  const t: IPlanSheetStrings = useSelector(planSheetSelector, shallowEqual);

  const handleMenu = (e: any) => {
    setActionMenuItem(e.currentTarget);
  };

  const handleClose = () => {
    setActionMenuItem(undefined);
    handleNoContextMenu();
  };

  const handleAction = (what: ExtraIcon) => () => {
    onAction(what);
    handleClose();
  };

  return (
    <>
      {canEditSheet && (
        <>
          <AltButton
            id="planSheetAddSec"
            key="addSection"
            aria-label={t.addSection}
            onClick={handleMenu}
            disabled={readonly}
          >
            {t.addSection.replace('{0}', organizedBy)}
            <DropDownIcon sx={iconMargin} />
          </AltButton>
          {!inlinePassages && (
            <AltButton
              id="planSheetAddPass"
              key="addPassage"
              aria-label={t.addPassage}
              onClick={handleMenu}
              disabled={numRows < 2 || readonly}
            >
              {t.addPassage}
              <DropDownIcon sx={iconMargin} />
            </AltButton>
          )}
          {/*Section Button Menu */}
          <Menu
            id="section-menu"
            anchorReference={'anchorEl'}
            anchorEl={actionMenuItem}
            open={actionMenuItem?.id === 'planSheetAddSec'}
            onClose={handleClose}
          >
            {onDisableFilter && (
              <MenuItem id="filtered" onClick={onDisableFilter}>
                {t.filtered}
              </MenuItem>
            )}
            {showIcon(ExtraIcon.MovementAbove) && (
              <MenuItem
                id="secAbove"
                onClick={handleAction(ExtraIcon.MovementAbove)}
              >
                <StyledMenuIcon>
                  <InsertMovementIcon />
                </StyledMenuIcon>
                {t.movementAbove
                  .replace('{0}', organizedBy)
                  .replace('{1}', sectionSequenceNumber)}
              </MenuItem>
            )}
            {showIcon(ExtraIcon.SectionAbove) && (
              <MenuItem
                id="secAbove"
                onClick={handleAction(ExtraIcon.SectionAbove)}
              >
                <StyledMenuIcon>
                  <InsertSectionIcon />
                </StyledMenuIcon>
                {t.sectionAbove
                  .replace('{0}', organizedBy)
                  .replace('{1}', organizedBy)
                  .replace('{2}', sectionSequenceNumber)}
              </MenuItem>
            )}
            {showIcon(ExtraIcon.SectionEnd) && (
              <MenuItem
                id="secEnd"
                onClick={handleAction(ExtraIcon.SectionEnd)}
              >
                <StyledMenuIcon>
                  <SectionEndIcon />
                </StyledMenuIcon>
                {t.sectionEnd.replace('{0}', organizedBy)}
              </MenuItem>
            )}
            {showIcon(ExtraIcon.Publishing) && canAddPublishing && (
              <MenuItem
                id="publishing"
                onClick={handleAction(ExtraIcon.Publishing)}
              >
                <StyledMenuIcon>
                  <AddPublishingIcon />
                </StyledMenuIcon>
                {t.addPublishing}
              </MenuItem>
            )}
          </Menu>
          {/*Passage Button Menu */}
          <Menu
            keepMounted
            open={!inlinePassages && actionMenuItem?.id === 'planSheetAddPass'}
            onClose={handleClose}
            anchorReference={'anchorEl'}
            anchorEl={actionMenuItem}
          >
            {onDisableFilter && (
              <MenuItem id="filtered" onClick={onDisableFilter}>
                {t.filtered}
              </MenuItem>
            )}
            {showIcon(ExtraIcon.PassageBelow) && isSection && (
              <MenuItem
                id="psgAsFirst"
                onClick={handleAction(ExtraIcon.PassageBelow)}
              >
                <StyledMenuIcon>
                  <PassageBelowIcon />
                </StyledMenuIcon>
                {t.insertFirstPassage
                  .replace('{0}', organizedBy)
                  .replace('{1}', sectionSequenceNumber)}
              </MenuItem>
            )}
            {showIcon(ExtraIcon.PassageBelow) && isPassage && (
              <MenuItem
                id="passBelow"
                onClick={handleAction(ExtraIcon.PassageBelow)}
              >
                <StyledMenuIcon>
                  <PassageBelowIcon />
                </StyledMenuIcon>
                {t.passageBelow.replace('{0}', passageSequenceNumber)}
              </MenuItem>
            )}
            {showIcon(ExtraIcon.PassageEnd) && (
              <MenuItem
                id="passageEnd"
                onClick={handleAction(ExtraIcon.PassageEnd)}
              >
                <StyledMenuIcon>
                  <PassageEndIcon />
                </StyledMenuIcon>
                {t.passageEnd}
              </MenuItem>
            )}
            {showIcon(ExtraIcon.Note) && (
              <MenuItem
                id="addnote"
                onClick={handleAction(ExtraIcon.Note)}
                title={t.addNote}
              >
                <StyledMenuIcon>
                  <AddNoteIcon />
                </StyledMenuIcon>
                {t.addNote}
              </MenuItem>
            )}
          </Menu>
        </>
      )}
      {!canEditSheet && showIcon(ExtraIcon.Publishing) && canAddPublishing && (
        <MenuItem id="publishing" onClick={handleAction(ExtraIcon.Publishing)}>
          <StyledMenuIcon>
            <AddPublishingIcon />
          </StyledMenuIcon>
          {t.addPublishing}
        </MenuItem>
      )}
    </>
  );
};
