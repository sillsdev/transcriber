import CheckedCheckBox from '@mui/icons-material/CheckBoxOutlined';
import UnCheckbox from '@mui/icons-material/CheckBoxOutlineBlankOutlined';
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

interface ActionColProps {
  row: number;
  checked: boolean;
  onSelect: (val: number) => void;
  onDelete: (val: number) => void;
}

function ActionCol({ row, checked, onSelect, onDelete }: ActionColProps) {
  const handleToggle = (row: number) => () => onSelect(row);
  const handleDelete = (row: number) => () => onDelete(row);

  return (
    <Stack direction="row" sx={{ alignItems: 'center' }}>
      <IconButton onClick={handleToggle(row)}>
        {!checked ? (
          <UnCheckbox fontSize="small" />
        ) : (
          <CheckedCheckBox fontSize="small" />
        )}
      </IconButton>
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
  const bookMap = useSelector((state: IState) => state.books.map);
  const bookSuggestions = useSelector(
    (state: IState) => state.books.suggestions
  );
  const suggestionRef = useRef<Array<OptionType>>();
  const preventSave = useRef<boolean>(false);

  const readOnlys = [false, false, true];
  const widths = [200, 400, 60];
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

  const handleToggle = (row: number) => {
    let newData = dataRef.current.map((r) => r);
    const newValue = !Boolean(newData[row][ColName.Act]?.checked) ? 'X' : '';
    newData[row] = rowCells(
      row,
      newData[row].map((c, i) => (i !== ColName.Act ? c.value : newValue))
    );
    updData(newData);
  };

  const handleDelete = (row: number) => {
    console.log(`deleting ${row}`);
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
                onSelect={handleToggle}
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
    </Stack>
  );
}
