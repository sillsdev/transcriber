import { ISheet, SheetLevel } from '../../model';
import { SectionSeqCol } from './PlanSheet';

interface IPubRefs {
  rowInfo: ISheet[];
  rowData: (string | number)[][];
  sectionMap: Map<number, string>;
  passageSeqCol: number;
  firstMovement: number;
}

export const getPubRefs = ({
  rowInfo,
  rowData,
  sectionMap,
  passageSeqCol,
  firstMovement,
}: IPubRefs) => {
  let curMove = firstMovement - 1;
  let curSection = 0;

  const dataSecs = rowInfo.reduce(
    (acc, row) =>
      [SheetLevel.Movement, SheetLevel.Section].includes(row.level)
        ? acc + 1
        : acc,
    0
  );

  if (dataSecs !== sectionMap?.size) {
    const idxs = rowData.map((r, i) => i);
    sectionMap?.clear();
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
        if (!sectionMap || !value || value <= -3) return;
        if (sectionMap.has(value)) return;
        if (rowInfo[index].level === SheetLevel.Movement) {
          const newValue = `M${++curMove}`;
          curSection = 0;
          sectionMap.set(value, newValue);
          return newValue;
        }
        if (rowInfo[index].level === SheetLevel.Section) {
          let newValue = '';
          if (curMove >= firstMovement) {
            newValue = `M${curMove} `;
          }
          newValue += `S${++curSection}`;
          sectionMap.set(value, newValue);
          return newValue;
        }
      });
  }
};
