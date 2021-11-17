import { IRowData } from '../../../context/PassageDetailContext';

export interface IRow extends IRowData {
  id: string;
  sequenceNum: number;
  version: number;
  done: boolean;
}
