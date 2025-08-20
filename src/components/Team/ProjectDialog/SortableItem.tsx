import { ProjectD } from '../../../model';
import { TableRow } from './TableRow';

interface IProps {
  value: ProjectD;
}

export const SortableItem = ({ value }: IProps) => <TableRow value={value} />;
