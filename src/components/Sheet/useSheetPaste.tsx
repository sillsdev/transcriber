import {
  IMediaShare,
  IScriptureTableStrings,
  IwsKind,
  ISheet,
  SheetLevel,
} from '../../model';
import { useSnackBar } from '../../hoc/SnackBar';
import { currentDateTime } from '../../utils/currentDateTime';
import { parseInt } from 'lodash';
import { useOrganizedBy } from '../../crud/useOrganizedBy';
import { PublishLevelEnum } from '../../crud';

interface MySheet extends ISheet {
  [key: string]: any;
}

interface IProps {
  secNumCol: number;
  passNumCol: number;
  scripture: boolean;
  flat: boolean;
  shared: boolean;
  colNames: string[];
  findBook: (val: string) => string;
  t: IScriptureTableStrings;
}

export const useWfPaste = (props: IProps) => {
  const { secNumCol, passNumCol, flat, t, shared } = props;
  const { colNames, findBook } = props;
  const { showMessage } = useSnackBar();
  const { getOrganizedBy } = useOrganizedBy();

  const isBlankOrValidNumber = (value: string): boolean => {
    return /^\s*-?\d*\.?\d*$/.test(value);
  };

  const isValidNumber = (value: string): boolean => {
    return /^-?\d*\.?\d+$/.test(value);
  };

  const validTable = (rows: string[][]) => {
    if (rows.length === 0) {
      showMessage(t.pasteNoRows);
      return false;
    }
    const organizedBy = getOrganizedBy(true);
    if (rows[0].length !== colNames.length) {
      showMessage(
        t.pasteInvalidColumns
          .replace('{0}', rows[0].length.toString())
          .replace('{1}', colNames.length.toString())
      );
      return false;
    }

    let invalidSec = rows
      .filter(
        (row, rowIndex) => rowIndex > 0 && !isBlankOrValidNumber(row[secNumCol])
      )
      .map((row) => row[secNumCol]);
    if (invalidSec.length > 0) {
      showMessage(
        <span>
          {t.pasteInvalidSections.replace('{0}', organizedBy)}{' '}
          {invalidSec.join()}
        </span>
      );
      return false;
    }
    if (!flat) {
      let invalidPas = rows
        .filter(
          (row, rowIndex) =>
            rowIndex > 0 && !isBlankOrValidNumber(row[passNumCol])
        )
        .map((row) => row[passNumCol]);
      if (invalidPas.length > 0) {
        showMessage(
          <span>
            {t.pasteInvalidSections.replace('{0}', t.passage)}{' '}
            {invalidPas.join()}.
          </span>
        );
        return false;
      }
      const isNumPat = /^\s*-?[0-9]/;
      let firstSection = rows.findIndex((r) => isNumPat.test(r[secNumCol]));
      let firstPassage = rows.findIndex((r) => isNumPat.test(r[passNumCol]));
      if (firstSection > firstPassage) {
        showMessage(
          t.pasteInvalidPassageBeforeSection.replace(
            '{0}',
            organizedBy.toLocaleLowerCase()
          )
        );
        return false;
      }
    }
    return true;
  };

  const splitSectionPassage = (
    value: string[],
    index: number,
    array: string[][]
  ): void => {
    if (isValidNumber(value[secNumCol]) && isValidNumber(value[passNumCol])) {
      let cp = [...value];
      cp[passNumCol] = '';
      value[secNumCol] = '';
      array.splice(index, 0, cp); //copy the row -- the copy goes in before
    }
  };

  return (rows: string[][]) => {
    const valid = validTable(rows);
    let addedWorkflow: ISheet[] = [];
    if (valid) {
      let startRow = 0;
      while (startRow < rows.length) {
        if (
          isBlankOrValidNumber(rows[startRow][secNumCol]) &&
          rows[startRow][secNumCol].trim() !== ''
        )
          break;
        startRow++;
      }
      if (!flat) {
        while (
          rows.find((value: string[]) => {
            return (
              isValidNumber(value[secNumCol]) &&
              isValidNumber(value[passNumCol])
            );
          }) !== undefined
        ) {
          rows.forEach(splitSectionPassage);
        }
      }
      /* Make it clear which columns can be imported by blanking others */
      let lastSec = 0;
      const updatedAt = currentDateTime();
      rows
        .filter((row, rowIndex) => rowIndex >= startRow)
        .filter(
          (row2) =>
            isValidNumber(row2[secNumCol]) || isValidNumber(row2[passNumCol])
        )
        .forEach((r) => {
          const ws = { deleted: false } as MySheet;
          colNames.forEach((c, i) => {
            const val = r[i];
            if (c === 'book') ws.book = findBook(val);
            else if (c === 'sectionSeq') {
              if (isValidNumber(val)) lastSec = parseInt(val);
              ws.sectionSeq = lastSec;
              ws.sectionUpdated = updatedAt;
            } else if (c === 'passageSeq') {
              ws.passageSeq = isValidNumber(val) ? parseInt(val) : 0;
              ws.passageUpdated = updatedAt;
            } else ws[c] = val;
          });
          if (ws.passageSeq) {
            ws.level = SheetLevel.Passage;
            ws.kind = flat ? IwsKind.SectionPassage : IwsKind.Passage;
            ws.mediaShared = shared ? IMediaShare.None : IMediaShare.NotPublic;
          } else {
            ws.level = SheetLevel.Section;
            ws.kind = flat ? IwsKind.SectionPassage : IwsKind.Section;
            ws.published = PublishLevelEnum.None;
            if (ws.passageSeq === undefined) {
              ws.passageSeq = 1;
              ws.passageUpdated = updatedAt;
            }
          }
          addedWorkflow.push(ws);
        });
    }
    return { valid, addedWorkflow };
  };
};
