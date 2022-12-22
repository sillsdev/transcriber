import { SortableElement, SortableElementProps } from 'react-sortable-hoc';
import { IRow } from '../../../context/PassageDetailContext';
import { TableRow, PlayButton, DoneButton, ResourceEditAction } from '.';
import { SectionResource } from '../../../model';
import { ViewButton } from './ViewButton';
import { PropsWithChildren } from 'react';

interface IProps {
  value: IRow;
  isPlaying: boolean;
  onPlay: (id: string) => void;
  onView: (id: string) => void;
  onDone: (id: string, res: SectionResource | null) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export const SortableItem = SortableElement<IProps & SortableElementProps & PropsWithChildren>(
  ({ value, isPlaying, onPlay, onView, onDone, onEdit, onDelete }: IProps) => (
    <TableRow
      value={
        {
          ...value,
          playItem: value.isText ? (
            <ViewButton id={value.id} cb={onView} />
          ) : (
            <PlayButton value={!isPlaying} id={value.id} cb={onPlay} />
          ),
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
