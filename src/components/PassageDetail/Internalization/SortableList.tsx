import { List } from '@material-ui/core';
import { SortableContainer } from 'react-sortable-hoc';

export const SortableList = SortableContainer(
  ({ children }: { children: JSX.Element[] }) => {
    return <List>{children}</List>;
  }
);
