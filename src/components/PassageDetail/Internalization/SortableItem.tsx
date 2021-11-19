import { SortableElement } from 'react-sortable-hoc';
import { IRow } from '../../../context/PassageDetailContext';
import { TableRow, PlayButton, DoneButton } from '.';

interface IProps {
  value: IRow;
  playItem: string;
  handlePlay: (id: string) => void;
  handleDone: (id: string) => void;
}

export const SortableItem = SortableElement(
  ({ value, playItem, handlePlay, handleDone }: IProps) => (
    <TableRow
      value={
        {
          ...value,
          playItem: (
            <PlayButton
              value={playItem !== value.id}
              id={value.id}
              cb={handlePlay}
            />
          ),
          done: <DoneButton value={value.done} id={value.id} cb={handleDone} />,
        } as any
      }
    />
  )
);
