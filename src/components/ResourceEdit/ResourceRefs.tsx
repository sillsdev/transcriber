import Delete from '@mui/icons-material/Delete';
import {
  Box,
  BoxProps,
  Button,
  ButtonGroup,
  IconButton,
  Stack,
  styled,
} from '@mui/material';
import React, { useRef } from 'react';
import DataSheet from 'react-datasheet';
import { useSelector } from 'react-redux';
import { IState } from '../../model';
import BookSelect, { OptionType } from '../BookSelect';
import { ActionRow, AltButton, PriButton } from '../StepEditor';
import Confirm from '../AlertDialog';

interface ActionColProps {
  row: number;
  checked: boolean;
  onDelete: (val: number) => void;
}

function ActionCol({ row, checked, onDelete }: ActionColProps) {
  const handleDelete = (row: number) => () => onDelete(row);

  return (
    <Stack direction="row" sx={{ alignItems: 'center' }}>
      <IconButton onClick={handleDelete(row)}>
        <Delete fontSize="small" />
      </IconButton>
    </Stack>
  );
}

const t = {
  book: 'Book',
  references: 'References',
  action: 'Action',
  bookSelect: 'Select Book',
  deleteConfirm: 'Delete {0}',
};

const Content = styled(Box)<BoxProps>(({ theme }) => ({
  '& .data-grid-container .data-grid .cell': {
    verticalAlign: 'middle',
    textAlign: 'left',
    paddingLeft: theme.spacing(0.5),
    paddingRight: theme.spacing(0.5),
  },
}));

interface ICell {
  value: any;
  readOnly?: boolean;
  width?: number;
  className?: string;
  checked?: boolean;
}

interface ICellChange {
  cell: any;
  row: number;
  col: number;
  value: string | null;
}

export default function ResourceRefs() {
  const [data, setData] = React.useState<ICell[][]>([]);
  const dataRef = React.useRef<ICell[][]>([]);
  const [confirmRow, setConfirmRow] = React.useState<number>();
  const bookMap = useSelector((state: IState) => state.books.map);
  const bookSuggestions = useSelector(
    (state: IState) => state.books.suggestions
  );
  const suggestionRef = useRef<Array<OptionType>>();
  const preventSave = useRef<boolean>(false);

  const readOnlys = [false, false, true];
  const widths = [170, 400, 30];
  const cClass = ['book', 'refs', 'act'];

  enum ColName {
    Book,
    Refs,
    Act,
  }

  const handleSetPreventSave = (val: boolean) => {
    preventSave.current = val;
  };

  const updData = (newData: ICell[][]) => {
    setData(newData);
    dataRef.current = newData;
  };

  const bookEditor = (props: any) => {
    // if (readonly) return <></>;
    return (
      <BookSelect
        id="book"
        suggestions={suggestionRef.current ? suggestionRef.current : []}
        placeHolder={t.bookSelect}
        setPreventSave={handleSetPreventSave}
        {...props}
      />
    );
  };

  const deleteConfirmed = () => {
    if (confirmRow === undefined) return;
    const newData: ICell[][] = [];
    let c = 0;
    const myData = dataRef.current;
    for (let i = 0; i < myData.length; i++) {
      if (i < confirmRow) {
        newData.push(dataRef.current[i]);
        c++;
        // were skipping i === confirmRow (c becomes one less than i)
      } else if (i > confirmRow) {
        // we need to update the delete action for rows after deleted row
        newData.push(
          rowCells(
            c,
            myData[i].map((v) => v.value)
          )
        );
        c++;
      }
    }
    updData(newData);
    setConfirmRow(undefined);
  };

  const deleteRejected = () => {
    setConfirmRow(undefined);
  };

  const handleDelete = (row: number) => {
    setConfirmRow(row);
  };

  const rowCells = (n: number, row: string[]) =>
    row.map((v, i) =>
      i === ColName.Book
        ? ({
            value: v,
            width: widths[i],
            readOnly: n === 0 || readOnlys[i],
            className: n === 0 ? 'cTitle' : cClass[i],
            dataEditor: bookEditor,
          } as ICell)
        : i === ColName.Act && n > 0
        ? ({
            value: (
              <ActionCol
                row={n}
                checked={Boolean(row[ColName.Act])}
                onDelete={handleDelete}
              />
            ),
            width: widths[i],
            readOnly: true,
            className: n === 0 ? 'cTitle' : cClass[i],
            checked: Boolean(row[ColName.Act]),
          } as ICell)
        : ({
            value: v,
            width: widths[i],
            readOnly: n === 0 || readOnlys[i],
            className: n === 0 ? 'cTitle' : cClass[i],
          } as ICell)
    );

  const emptyTable = () => [rowCells(0, [t.book, t.references, t.action])];
  const emptyRow = () => ['', '', ''].map((c) => c);

  React.useEffect(() => {
    suggestionRef.current = bookSuggestions;
  }, [bookSuggestions]);

  React.useEffect(() => {
    let newData: ICell[][] = emptyTable();
    newData.push(rowCells(1, emptyRow()));
    updData(newData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddWord = () => {};
  const handleCancel = () => {};
  const handleSave = () => {};

  const handleValueRenderer = (cell: ICell) =>
    cell.className?.substring(0, 4) === 'book' && bookMap
      ? bookMap[cell.value]
      : cell.value;

  const handleCellsChanged = (changes: Array<ICellChange>) => {
    const newData = dataRef.current.map((r) => r);
    changes.forEach((c) => {
      newData[c.row][c.col].value = c.value;
    });
    const len = dataRef.current.length;
    const lastRow = dataRef.current[len - 1];
    if (lastRow[0].value || lastRow[1].value)
      newData.push(rowCells(len, emptyRow()));
    updData(newData);
  };

  const confirmMsg = (row: number | undefined) => {
    if (!row) return '';
    const bookCode = dataRef.current[row][ColName.Book].value;
    let bookLabel = '';
    if (suggestionRef.current) {
      const bookLabels = suggestionRef.current.filter(
        (s) => s.value === bookCode
      );
      if (bookLabels.length > 0) bookLabel = bookLabels[0].label;
    }
    return `${bookLabel} ${dataRef.current[row][ColName.Refs].value}`;
  };

  return (
    <Stack spacing={1}>
      <ButtonGroup>
        <Button onClick={handleAddWord}>By Word</Button>
      </ButtonGroup>
      <Content>
        <DataSheet
          data={data}
          valueRenderer={handleValueRenderer}
          onCellsChanged={handleCellsChanged}
        />
      </Content>
      <ActionRow>
        <AltButton onClick={handleCancel}>Cancel</AltButton>
        <PriButton onClick={handleSave}>Save</PriButton>
      </ActionRow>
      {confirmRow && (
        <Confirm
          text={t.deleteConfirm.replace('{0}', confirmMsg(confirmRow))}
          yesResponse={deleteConfirmed}
          noResponse={deleteRejected}
        />
      )}
    </Stack>
  );
}
