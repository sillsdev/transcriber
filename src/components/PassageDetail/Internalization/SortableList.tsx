import { List } from '@mui/material';
import { PropsWithChildren } from 'react';
import { SortableContainer, SortableContainerProps } from 'react-sortable-hoc';

export const SortableList = SortableContainer<SortableContainerProps & PropsWithChildren>(
  ({ children }: { children: JSX.Element[] }) => {
    return <List id="sortable-list">{children}</List>;
  }
);
