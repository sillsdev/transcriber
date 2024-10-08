import { ISheet } from '../../model';
import { workSheet } from './workSheet';

interface ILocalName {
  [key: string]: string;
}

interface IColDesc {
  value: string;
  width: number;
  readOnly: boolean;
}

interface IMinWidth {
  [key: string]: number;
}

export const shtColumnHeads = (
  ws: ISheet[],
  width: number,
  colNames: string[],
  localName: ILocalName,
  minWidth: IMinWidth
) => {
  const sheet: Array<Array<any>> = workSheet(ws, colNames, ws);
  const colMx: Array<number> = sheet.reduce(
    (prev, cur) =>
      cur.map((v, i) =>
        Math.max(
          prev[i],
          !v ? 1 : typeof v === 'number' ? v.toString().length : v.length
        )
      ),
    new Array(colNames.length).fill(0)
  );
  const total = colMx.reduce((prev, cur) => prev + cur, 0);
  const colMul = colMx.map((v) => (total ? v / total : 0));
  const extra = Math.max(width - 1020, 0);
  const colAdd = colMul.map((v) => Math.floor(extra * v));
  const colHead = new Array<IColDesc>();
  colNames.forEach((c, i) => {
    colHead.push({
      value: localName[c],
      width: minWidth[c] + colAdd[i],
      readOnly: true,
    });
  });
  return { colHead, colAdd };
};
