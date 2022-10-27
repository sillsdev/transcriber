import { List } from '@mui/material';
import { SortableContainer } from 'react-sortable-hoc';

export const StepList = SortableContainer(
  ({ children }: { children: JSX.Element[] }) => {
    return <List id="sortable-steps">{children}</List>;
  }
);
