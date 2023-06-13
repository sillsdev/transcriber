import React, { useState } from 'react';
import { IPlanSheetStrings } from '../model';
import { Menu, MenuItem } from '@mui/material';
import DropDownIcon from '@mui/icons-material/ArrowDropDown';
import { iconMargin, AltButton } from '../control';
import { useOrganizedBy } from '../crud';
import { planSheetSelector } from '../selector';
import { shallowEqual, useSelector } from 'react-redux';
import {
  InsertSectionIcon,
  PassageBelowIcon,
  PassageEndIcon,
  SectionEndIcon,
} from './PlanIcons';

interface IProps {
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
  onPassageBelow?: () => void;
  onPassageLast?: () => void;
  onSectionAbove?: () => void;
  onSectionEnd?: () => void;
  onPassageEnd?: () => void;
}

export const AddSectionPassageButtons = (props: IProps) => {
  const {
    readonly,
    inlinePassages,
    numRows,
    sectionSequenceNumber,
    passageSequenceNumber,
    onDisableFilter,
    isSection,
    isPassage,
    handleNoContextMenu,
    onPassageBelow,
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
  /*
  const handlePassageLast = () => {
    onPassageLast && onPassageLast();
    handleClose();
  };*/

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
        {onSectionAbove && (
          <MenuItem id="secAbove" onClick={handleSectionAbove}>
            <InsertSectionIcon />
            {'\u00A0\u00A0\u00A0'}
            {t.sectionAbove
              .replace('{0}', organizedBy)
              .replace('{1}', organizedBy)
              .replace('{2}', sectionSequenceNumber)}
          </MenuItem>
        )}
        {onSectionEnd && (
          <MenuItem id="secEnd" onClick={onSectionEnd}>
            <SectionEndIcon /> {'\u00A0\u00A0\u00A0'}
            {t.sectionEnd.replace('{0}', organizedBy)}
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
        {onPassageBelow && isSection && (
          <MenuItem id="psgAsFirst" onClick={handlePassageBelow}>
            <PassageBelowIcon /> {'\u00A0\u00A0\u00A0'}
            {t.insertFirstPassage
              .replace('{0}', organizedBy)
              .replace('{1}', sectionSequenceNumber)}
          </MenuItem>
        )}
        {/*
        {onPassageLast && (
          <MenuItem id="psgAsLast" onClick={handlePassageLast}>
            {t.insertLastPassage
              .replace('{0}', organizedBy)
              .replace('{1}', sectionSequenceNumber)}
          </MenuItem>
            )} */}
        {onPassageBelow && isPassage && (
          <MenuItem id="passBelow" onClick={handlePassageBelow}>
            <PassageBelowIcon />
            {'\u00A0\u00A0\u00A0'}
            {t.passageBelow.replace('{0}', passageSequenceNumber)}
          </MenuItem>
        )}
        {onPassageEnd && (
          <MenuItem id="passageEnd" onClick={onPassageEnd}>
            <PassageEndIcon />
            {'\u00A0\u00A0\u00A0'}
            {t.passageEnd}
          </MenuItem>
        )}
      </Menu>
    </>
  );
};
