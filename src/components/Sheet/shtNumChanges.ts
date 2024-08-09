import { isSectionRow, isPassageRow } from './isSectionPassage';
import { isSectionUpdated, isPassageUpdated } from './isSectionPassageUpdated';
import { ISheet } from '../../model';

export const shtNumChanges = (sheet: ISheet[], lastSaved: string | undefined) =>
  sheet.reduce((prev, cur) => {
    let secChange = false;
    if (isSectionRow(cur) && isSectionUpdated(cur, lastSaved)) {
      secChange = true;
    }
    let passChanged = false;
    if (isPassageRow(cur) && isPassageUpdated(cur, lastSaved)) {
      passChanged = true;
    }
    return prev + (secChange ? 1 : 0) + (passChanged ? 1 : 0);
  }, 0);
