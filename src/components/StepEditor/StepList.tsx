import { List } from '@mui/material';
import { PropsWithChildren } from 'react';
import { SortableContainer, SortableContainerProps } from 'react-sortable-hoc';

export const StepList = SortableContainer<SortableContainerProps & PropsWithChildren>(
  ({ children }: { children: JSX.Element[] }) => {
    return <List id="sortable-steps">{children}</List>;
  }
);
