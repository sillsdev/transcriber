import { ISheet, SheetLevel } from '../../model';
import { SectionSeqCol } from './PlanSheet';

interface IPubRefs {
  rowInfo: ISheet[];
  rowData: (string | number)[][];
  passageSeqCol: number;
  firstMovement: number;
}

export const getPubRefs = ({
  rowInfo,
  rowData,
  passageSeqCol,
  firstMovement,
}: IPubRefs) => {
  let curMove = firstMovement - 1;
  let curSection = 0;

  const results: [number, string][] = []

  const idxs = rowData.map((r, i) => i);
  idxs
    .sort((a, b) => {
      const result =
        (rowData[a][SectionSeqCol] as number) -
        (rowData[b][SectionSeqCol] as number);
      if (result !== 0 || passageSeqCol < 0) return result;
      return (
        (rowData[a][passageSeqCol] as number) -
        (rowData[b][passageSeqCol] as number)
      );
    })
    .forEach((index) => {
      const value = rowData[index][SectionSeqCol] as number;
      if (!value || value <= -3) return;
      if (rowInfo[index].level === SheetLevel.Movement) {
        const newValue = `M${++curMove}`;
        curSection = 0;
        results.push([value, newValue])
      }
      if (rowInfo[index].level === SheetLevel.Section) {
        let newValue = '';
        if (curMove >= firstMovement) {
          newValue = `M${curMove} `;
        }
        newValue += `S${++curSection}`;
        results.push([value, newValue])
      }
    });
    return results;
};
