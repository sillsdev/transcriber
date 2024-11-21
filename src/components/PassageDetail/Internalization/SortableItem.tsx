import { IRow } from '../../../context/PassageDetailContext';
import { TableRow, PlayButton, DoneButton, ResourceEditAction } from '.';
import { SectionResourceD } from '../../../model';
import { ViewButton } from './ViewButton';
import { MarkDownType, UriLinkType } from '../../MediaUpload';

interface IProps {
  value: IRow;
  contentType: string;
  isPlaying: boolean;
  onPlay: (id: string) => void;
  onView: (id: string) => void;
  onLink: (id: string) => void;
  onMarkDown: (id: string) => void;
  onDone: (id: string, res: SectionResourceD | null) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export const SortableItem = ({
  value,
  contentType,
  isPlaying,
  onPlay,
  onView,
  onLink,
  onMarkDown,
  onDone,
  onEdit,
  onDelete,
}: IProps) => (
  <TableRow
    value={
      {
        ...value,
        playItem:
          contentType === UriLinkType ? (
            <ViewButton id={value.id} cb={onLink} />
          ) : contentType === MarkDownType ? (
            <ViewButton id={value.id} cb={onMarkDown} />
          ) : !/^audio/.test(contentType) ? (
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
