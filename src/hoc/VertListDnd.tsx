import { PropsWithChildren, ReactNode, useState } from 'react';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd';
import { List, ListItem } from '@mui/material';

export interface DropProp {
  id: string;
  content: ReactNode;
}

// fake data generator
const getItems = (count: number) =>
  Array.from({ length: count }, (_v, k) => k).map((k) => ({
    id: `${k}`,
    content: `item ${k}`,
  }));

// convert children to ItemProps
const cvtChildren = (children?: ReactNode): DropProp[] | undefined => {
  if (Array.isArray(children)) {
    return children.map((child, index) => ({
      id: `${index}`,
      content: child,
    }));
  }
  if (children) {
    return [{ id: '0', content: children }];
  }
};

export interface OnDropProps {
  results: string[];
  oldIndex: number;
  newIndex: number;
}

export interface VertListDndProps extends PropsWithChildren {
  data?: DropProp[];
  dragHandle?: boolean;
  onDrop?: (props: OnDropProps) => void;
}

export const VertListDnd = ({
  data,
  onDrop,
  dragHandle,
  children,
}: VertListDndProps) => {
  const [items, setItems] = useState<DropProp[]>(
    data ?? cvtChildren(children) ?? getItems(10)
  );

  // a little function to help us with reordering the result
  const reorder = (list: DropProp[], startIndex: number, endIndex: number) => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    return result;
  };

  const onDragEnd = (result: DropResult) => {
    // dropped outside the list
    if (!result.destination) {
      return;
    }
    const newItems = reorder(
      items,
      result.source.index,
      result.destination.index
    );
    setItems(newItems);
    if (onDrop) {
      onDrop({
        results: newItems.map((item) => item.id),
        oldIndex: result.source.index,
        newIndex: result.destination.index,
      });
    }
  };

  // Normally you would want to split things out into separate components.
  // But in this example everything is just done in one place for simplicity
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="droppable">
        {(provided, snapshot) => (
          <List
            {...provided.droppableProps}
            ref={provided.innerRef}
            sx={{
              bgcolor: snapshot.isDraggingOver ? 'secondary.light' : 'white',
              p: 1,
            }}
          >
            {items.map((item, index) => (
              <Draggable key={item.id} draggableId={item.id} index={index}>
                {(provided, snapshot) => (
                  <ListItem
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    sx={{
                      bgcolor: snapshot.isDragging
                        ? 'primary.light'
                        : dragHandle
                        ? 'transparent'
                        : 'lightgrey',
                      mb: 1,
                    }}
                  >
                    {item.content}
                  </ListItem>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </List>
        )}
      </Droppable>
    </DragDropContext>
  );
};
