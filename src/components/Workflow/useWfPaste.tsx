import { IScriptureTableStrings, IwfKind, IWorkflow } from '../../model';
import { useSnackBar } from '../../hoc/SnackBar';
import { currentDateTime } from '../../utils/currentDateTime';
import { parseInt } from 'lodash';
import { useOrganizedBy } from '../../crud/useOrganizedBy';

interface MyWorkflow extends IWorkflow {
  [key: string]: any;
}

interface IProps {
  secNumCol: number;
  passNumCol: number;
  scripture: boolean;
  flat: boolean;
  colNames: string[];
  findBook: (val: string) => string;
  t: IScriptureTableStrings;
}

export const useWfPaste = (props: IProps) => {
  const { secNumCol, passNumCol, scripture, flat, t } = props;
  const { colNames, findBook } = props;
  const { showMessage } = useSnackBar();
  const { getOrganizedBy } = useOrganizedBy();

  const isBlankOrValidNumber = (value: string): boolean => {
    return /^[0-9]*$/.test(value);
  };

  const isValidNumber = (value: string): boolean => {
    return /^[0-9]+$/.test(value);
  };

  const validTable = (rows: string[][]) => {
    if (rows.length === 0) {
      showMessage(t.pasteNoRows);
      return false;
    }
    const organizedBy = getOrganizedBy(true);
    if (scripture) {
      if (rows[0].length !== colNames.length) {
        showMessage(
          t.pasteInvalidColumnsScripture.replace(
            '{0}',
            rows[0].length.toString()
          )
        );
        return false;
      }
    } else {
      if (rows[0].length !== colNames.length) {
        showMessage(
          t.pasteInvalidColumnsGeneral.replace('{0}', rows[0].length.toString())
        );
        return false;
      }
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
    let addedWorkflow: IWorkflow[] = [];
    if (valid) {
      const startRow = isBlankOrValidNumber(rows[0][secNumCol]) ? 0 : 1;
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
          const wf = { deleted: false } as MyWorkflow;
          colNames.forEach((c, i) => {
            const val = r[i];
            if (c === 'book') wf.book = findBook(val);
            else if (c === 'sectionSeq') {
              if (isValidNumber(val)) lastSec = parseInt(val);
              wf.sectionSeq = lastSec;
              wf.sectionUpdated = updatedAt;
            } else if (c === 'passageSeq') {
              wf.passageSeq = isValidNumber(val) ? parseInt(val) : 0;
              wf.passageUpdated = updatedAt;
            } else wf[c] = val;
          });
          if (wf.passageSeq) {
            wf.level = flat ? 0 : 1;
            wf.kind = flat ? IwfKind.SectionPassage : IwfKind.Passage;
          } else {
            wf.level = 0;
            wf.kind = flat ? IwfKind.SectionPassage : IwfKind.Section;
            if (wf.passageSeq === undefined) {
              wf.passageSeq = 1;
              wf.passageUpdated = updatedAt;
            }
          }
          addedWorkflow.push(wf);
        });
    }
    return { valid, addedWorkflow };
  };
};
