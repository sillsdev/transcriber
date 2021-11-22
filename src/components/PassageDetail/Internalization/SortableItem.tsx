import { SortableElement } from 'react-sortable-hoc';
import { IRow } from '../../../context/PassageDetailContext';
import { TableRow, PlayButton, DoneButton, ResourceEditAction } from '.';

interface IProps {
  value: IRow;
  playItem: string;
  onPlay: (id: string) => void;
  onDone: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export const SortableItem = SortableElement(
  ({ value, playItem, onPlay, onDone, onEdit, onDelete }: IProps) => (
    <TableRow
      value={
        {
          ...value,
          playItem: (
            <PlayButton
              value={playItem !== value.id}
              id={value.id}
              cb={onPlay}
            />
          ),
          done: <DoneButton value={value.done} id={value.id} cb={onDone} />,
          editAction: (
            <ResourceEditAction
              item={value.id}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ),
        } as any
      }
    />
  )
);
