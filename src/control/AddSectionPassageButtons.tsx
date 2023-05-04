import React, { useMemo, useState } from 'react';
import { IPlanSheetStrings } from '../model';
import { Menu, MenuItem } from '@mui/material';
import DropDownIcon from '@mui/icons-material/ArrowDropDown';
import { iconMargin, AltButton } from '../control';
import { useOrganizedBy } from '../crud';
import { planSheetSelector } from '../selector';
import { shallowEqual, useSelector } from 'react-redux';

interface IProps {
  readonly: boolean;
  inlinePassages: boolean;
  numRows: number;
  currentrow: number;
  mouseposition: {
    mouseX: null | number;
    mouseY: null | number;
    i: number;
    j: number;
  };
  sectionSequenceNumber: string;
  passageSequenceNumber: string;
  onDisableFilter?: () => void;
  isSection: (i: number) => boolean;
  isPassage: (i: number) => boolean;
  handleNoContextMenu: () => void;
  onPassageBelow?: () => void;
  onPassageLast?: () => void;
  onPassageToPrev?: () => void;
  onPassageToNext?: () => void;
  onSectionAbove?: () => void;
  onSectionEnd?: () => void;
  onPassageEnd?: () => void;
}

export const AddSectionPassageButtons = (props: IProps) => {
  const {
    readonly,
    inlinePassages,
    numRows,
    currentrow,
    mouseposition,
    sectionSequenceNumber,
    passageSequenceNumber,
    onDisableFilter,
    isSection,
    isPassage,
    handleNoContextMenu,
    onPassageBelow,
    onPassageLast,
    onPassageToPrev,
    onPassageToNext,
    onSectionAbove,
    onSectionEnd,
    onPassageEnd,
  } = props;
  const [actionMenuItem, setActionMenuItem] = React.useState<any>(undefined);
  const { getOrganizedBy } = useOrganizedBy();
  const [organizedBy] = useState(getOrganizedBy(true));
  const t: IPlanSheetStrings = useSelector(planSheetSelector, shallowEqual);

  const handleMenu = (e: any) => {
    setActionMenuItem(e.currentTarget);
  };

  const handleClose = () => {
    setActionMenuItem(undefined);
    handleNoContextMenu();
  };

  const handleSectionAbove = () => {
    onSectionAbove && onSectionAbove();
    handleClose();
  };

  const handlePassageBelow = () => {
    onPassageBelow && onPassageBelow();
    handleClose();
  };
  const handlePassageLast = () => {
    onPassageLast && onPassageLast();
    handleClose();
  };

  const handlePassageToPrev = () => {
    onPassageToPrev && onPassageToPrev();
    handleClose();
  };

  const handlePassageToNext = () => {
    onPassageToNext && onPassageToNext();
    handleClose();
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const isContextMenu = useMemo(
    () => mouseposition.mouseX != null,
    [mouseposition]
  );
  const currentisPassage = useMemo(
    () => isPassage(currentrow),
    [isPassage, currentrow]
  );

  const currentisSection = useMemo(
    () => isSection(currentrow),
    [isSection, currentrow]
  );
  return (
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
      {/*Section Button Menu and Context Menu */}
      <Menu
        id="section-menu"
        anchorReference={isContextMenu ? 'anchorPosition' : 'anchorEl'}
        anchorEl={actionMenuItem}
        anchorPosition={
          isContextMenu
            ? {
                top: mouseposition.mouseY ?? 0,
                left: mouseposition.mouseX ?? 0,
              }
            : undefined
        }
        open={
          actionMenuItem?.id === 'planSheetAddSec' ||
          (isContextMenu && currentisSection)
        }
        onClose={handleClose}
      >
        {onDisableFilter && (
          <MenuItem id="filtered" onClick={onDisableFilter}>
            {t.filtered}
          </MenuItem>
        )}
        {onSectionAbove && (
          <MenuItem id="secAbove" onClick={handleSectionAbove}>
            {t.sectionAbove
              .replace('{0}', organizedBy)
              .replace('{1}', organizedBy)
              .replace('{2}', sectionSequenceNumber)}
          </MenuItem>
        )}
        {onPassageBelow && (
          <MenuItem id="passageAsFirst" onClick={handlePassageBelow}>
            {t.insertFirstPassage
              .replace('{0}', organizedBy)
              .replace('{1}', sectionSequenceNumber)}
          </MenuItem>
        )}
        {onPassageLast && (
          <MenuItem id="passageAsLast" onClick={handlePassageLast}>
            {t.insertLastPassage
              .replace('{0}', organizedBy)
              .replace('{1}', sectionSequenceNumber)}
          </MenuItem>
        )}
        {onSectionEnd && (
          <MenuItem id="secEnd" onClick={onSectionEnd}>
            {t.sectionEnd.replace('{0}', organizedBy)}
          </MenuItem>
        )}
      </Menu>
      {/*Passage Button Menu and Context Menu */}
      <Menu
        keepMounted
        open={
          !inlinePassages &&
          (actionMenuItem?.id === 'planSheetAddPass' ||
            (isContextMenu && currentisPassage))
        }
        onClose={handleClose}
        anchorReference={isContextMenu ? 'anchorPosition' : 'anchorEl'}
        anchorEl={actionMenuItem}
        anchorPosition={
          isContextMenu
            ? {
                top: mouseposition.mouseY ?? 0,
                left: mouseposition.mouseX ?? 0,
              }
            : undefined
        }
      >
        {onDisableFilter && (
          <MenuItem id="filtered" onClick={onDisableFilter}>
            {t.filtered}
          </MenuItem>
        )}
        {onPassageBelow && currentisSection && (
          <MenuItem id="psgAsFirst" onClick={handlePassageBelow}>
            {t.insertFirstPassage
              .replace('{0}', organizedBy)
              .replace('{1}', sectionSequenceNumber)}
          </MenuItem>
        )}
        {onPassageLast && (
          <MenuItem id="psgAsLast" onClick={handlePassageLast}>
            {t.insertLastPassage
              .replace('{0}', organizedBy)
              .replace('{1}', sectionSequenceNumber)}
          </MenuItem>
        )}
        {onPassageToPrev && (
          <MenuItem id="passToPrev" onClick={handlePassageToPrev}>
            {t.passageToPrevSection.replace('{0}', passageSequenceNumber)}
          </MenuItem>
        )}

        {onPassageBelow && currentisPassage && (
          <MenuItem id="passBelow" onClick={handlePassageBelow}>
            {t.passageBelow.replace('{0}', passageSequenceNumber)}
          </MenuItem>
        )}
        {onPassageToNext && (
          <MenuItem id="passToNext" onClick={handlePassageToNext}>
            {t.passageToNextSection.replace('{0}', passageSequenceNumber)}
          </MenuItem>
        )}
        {onPassageEnd && (
          <MenuItem id="passageEnd" onClick={onPassageEnd}>
            {t.passageEnd}
          </MenuItem>
        )}
      </Menu>
    </>
  );
};
