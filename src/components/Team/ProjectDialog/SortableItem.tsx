import { VProjectD } from '../../../model';
import { TableRow } from './TableRow';

interface IProps {
  value: VProjectD;
}

export const SortableItem = ({ value }: IProps) => <TableRow value={value} />;
