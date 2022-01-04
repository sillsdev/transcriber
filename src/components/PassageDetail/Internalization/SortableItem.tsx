import { SortableElement } from 'react-sortable-hoc';
import { IRow } from '../../../context/PassageDetailContext';
import { TableRow, PlayButton, DoneButton, ResourceEditAction } from '.';
import { SectionResource } from '../../../model';

interface IProps {
  value: IRow;
  isPlaying: boolean;
  onPlay: (id: string) => void;
  onDone: (id: string, res: SectionResource | null) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export const SortableItem = SortableElement(
  ({ value, isPlaying, onPlay, onDone, onEdit, onDelete }: IProps) => (
    <TableRow
      value={
        {
          ...value,
          playItem: <PlayButton value={!isPlaying} id={value.id} cb={onPlay} />,
          done: (
            <DoneButton
              value={value.done}
              id={value.id}
              res={value.resource}
              cb={onDone}
            />
          ),
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
