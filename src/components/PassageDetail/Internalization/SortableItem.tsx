import { IRow } from '../../../context/PassageDetailContext';
import { TableRow, PlayButton, DoneButton, ResourceEditAction } from '.';
import { SectionResourceD } from '../../../model';
import { ViewButton } from './ViewButton';

interface IProps {
  value: IRow;
  isPlaying: boolean;
  onPlay: (id: string) => void;
  onView: (id: string) => void;
  onDone: (id: string, res: SectionResourceD | null) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export const SortableItem = ({
  value,
  isPlaying,
  onPlay,
  onView,
  onDone,
  onEdit,
  onDelete,
}: IProps) => (
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
);
