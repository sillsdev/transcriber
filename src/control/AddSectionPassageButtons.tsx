import React, { useMemo, useState } from 'react';
import { IPlanSheetStrings } from '../model';
import { Button, Menu, MenuItem } from '@material-ui/core';
import DropDownIcon from '@mui/icons-material/ArrowDropDown';
import { useOrganizedBy } from '../crud';
import styled from 'styled-components';

const Styles = styled.div`
  .button {
    margin: theme.spacing(1);
    overflow: 'hidden';
    white-space: 'nowrap';
    justify-content: 'flex-start';
  }
  .icon {
    margin-left: theme.spacing(1);
  }
`;

interface IStateProps {
  t: IPlanSheetStrings;
}

interface IProps extends IStateProps {
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
  isSection: (i: number) => boolean;
  isPassage: (i: number) => boolean;
  handleNoContextMenu: () => void;
  addPassage: (i?: number, before?: boolean) => void;
  movePassage: (i: number, before: boolean) => void;
  addSection: (i?: number) => void;
}

export const AddSectionPassageButtons = (props: IProps) => {
  const {
    readonly,
    inlinePassages,
    t,
    numRows,
    currentrow,
    mouseposition,
    sectionSequenceNumber,
    passageSequenceNumber,
    isSection,
    isPassage,
    handleNoContextMenu,
    addPassage,
    addSection,
    movePassage,
  } = props;
  const [actionMenuItem, setActionMenuItem] = React.useState<any>(undefined);
  const { getOrganizedBy } = useOrganizedBy();
  const [organizedBy] = useState(getOrganizedBy(true));
  const handleMenu = (e: any) => {
    setActionMenuItem(e.currentTarget);
  };

  const handleClose = () => {
    setActionMenuItem(undefined);
    handleNoContextMenu();
  };

  const handleSectionAbove = () => {
    //we'll find a section before we get past 0
    var row = currentrow;
    while (!isSection(row)) row -= 1;
    addSection(row);
    handleClose();
  };

  const handlePassageBelow = () => {
    addPassage(currentrow, false);
    handleClose();
  };
  const handlePassageLast = () => {
    //we're on a section so find our last row and add it below it
    var row = currentrow + 1;
    while (isPassage(row + 1)) row++;
    addPassage(row, false);
    handleClose();
  };

  const handlePassageToPrev = () => {
    movePassage(currentrow, true);
    handleClose();
  };

  const handlePassageToNext = () => {
    movePassage(currentrow, false);
    handleClose();
  };

  const handleSectionEnd = () => {
    addSection();
  };
  const handlePassageEnd = () => {
    addPassage();
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
    <Styles>
      <Button
        id="planSheetAddSec"
        key="addSection"
        aria-label={t.addSection}
        variant="outlined"
        color="primary"
        className="button"
        onClick={handleMenu}
        disabled={readonly}
      >
        {t.addSection.replace('{0}', organizedBy)}
        <DropDownIcon className="icon" />
      </Button>
      {!inlinePassages && (
        <Button
          id="planSheetAddPass"
          key="addPassage"
          aria-label={t.addPassage}
          variant="outlined"
          color="primary"
          className="button"
          onClick={handleMenu}
          disabled={numRows < 2 || readonly}
        >
          {t.addPassage}
          <DropDownIcon className="icon" />
        </Button>
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
        {currentrow >= 0 && (
          <MenuItem id="secAbove" onClick={handleSectionAbove}>
            {t.sectionAbove
              .replace('{0}', organizedBy)
              .replace('{1}', organizedBy)
              .replace('{2}', sectionSequenceNumber)}
          </MenuItem>
        )}
        {isContextMenu && (
          <MenuItem id="passageAsFirst" onClick={handlePassageBelow}>
            {t.insertFirstPassage
              .replace('{0}', organizedBy)
              .replace('{1}', sectionSequenceNumber)}
          </MenuItem>
        )}
        {isContextMenu && (
          <MenuItem id="passageAsLast" onClick={handlePassageLast}>
            {t.insertLastPassage
              .replace('{0}', organizedBy)
              .replace('{1}', sectionSequenceNumber)}
          </MenuItem>
        )}
        {!isContextMenu && (
          <MenuItem id="secEnd" onClick={handleSectionEnd}>
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
        } // && projRole === RoleNames.Admin}
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
        {currentisSection && (
          <MenuItem id="psgAsFirst" onClick={handlePassageBelow}>
            {t.insertFirstPassage
              .replace('{0}', organizedBy)
              .replace('{1}', sectionSequenceNumber)}
          </MenuItem>
        )}
        {currentisSection && (
          <MenuItem id="psgAsLast" onClick={handlePassageLast}>
            {t.insertLastPassage
              .replace('{0}', organizedBy)
              .replace('{1}', sectionSequenceNumber)}
          </MenuItem>
        )}
        {currentrow > 2 && currentisPassage && isSection(currentrow - 1) && (
          <MenuItem id="passToPrev" onClick={handlePassageToPrev}>
            {t.passageToPrevSection.replace('{0}', passageSequenceNumber)}
          </MenuItem>
        )}

        {currentisPassage && (
          <MenuItem id="passBelow" onClick={handlePassageBelow}>
            {t.passageBelow.replace('{0}', passageSequenceNumber)}
          </MenuItem>
        )}
        {currentisPassage && isSection(currentrow + 1) && (
          <MenuItem id="passToNext" onClick={handlePassageToNext}>
            {t.passageToNextSection.replace('{0}', passageSequenceNumber)}
          </MenuItem>
        )}
        {!isContextMenu && (
          <MenuItem id="passageEnd" onClick={handlePassageEnd}>
            {t.passageEnd}
          </MenuItem>
        )}
      </Menu>
    </Styles>
  );
};
