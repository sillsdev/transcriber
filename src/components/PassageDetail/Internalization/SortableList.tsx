import { List } from '@mui/material';
import { SortableContainer } from 'react-sortable-hoc';

export const SortableList = SortableContainer(
  ({ children }: { children: JSX.Element[] }) => {
    return <List id="sortable-list">{children}</List>;
  }
);
