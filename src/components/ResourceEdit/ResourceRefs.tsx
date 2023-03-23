import { Button, ButtonGroup, Stack } from '@mui/material';
import React from 'react';
import DataSheet from 'react-datasheet';
import { useSelector } from 'react-redux';
import { IState } from '../../model';
import { ActionRow, AltButton, PriButton } from '../StepEditor';

interface ICell {
  value: any;
  readOnly?: boolean;
  width?: number;
  className?: string;
}

interface ICellChange {
  cell: any;
  row: number;
  col: number;
  value: string | null;
}

export default function ResourceRefs() {
  const [data, setData] = React.useState<ICell[][]>([]);
  const bookMap = useSelector((state: IState) => state.books.map);

  const readOnlys = [false, false];
  const widths = [200, 400];
  const cClass = ['book', 'refs'];

  enum ColName {
    Book,
    Refs,
  }

  const rowCells = (row: string[], first = false) =>
    row.map(
      (v, i) =>
        ({
          value: v,
          width: widths[i],
          readOnly: first || readOnlys[i],
          className: first ? 'cTitle' : cClass[i],
        } as ICell)
    );

  const emptyTable = () => [rowCells(['Book', 'References'], true)];

  React.useEffect(() => {
    let newData: ICell[][] = emptyTable();
    setData(newData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddRef = () => {};
  const handleAddWord = () => {};
  const handleCancel = () => {};
  const handleSave = () => {};

  const handleValueRenderer = (cell: ICell) =>
    cell.className?.substring(0, 4) === 'book' && bookMap
      ? bookMap[cell.value]
      : cell.value;

  return (
    <Stack spacing={1}>
      <ButtonGroup>
        <Button onClick={handleAddRef}>Add Ref</Button>
        <Button onClick={handleAddWord}>By Word</Button>
      </ButtonGroup>
      <DataSheet data={data} valueRenderer={handleValueRenderer} />
      <ActionRow>
        <AltButton onClick={handleCancel}>Cancel</AltButton>
        <PriButton onClick={handleSave}>Save</PriButton>
      </ActionRow>
    </Stack>
  );
}
