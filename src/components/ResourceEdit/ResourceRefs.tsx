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
  select: string;
  onSelect: (val: number, select: string) => void;
  onDelete: (val: number) => void;
}

function ActionCol({ row, select, onSelect, onDelete }: ActionColProps) {
  const handleSelect = (row: number, select: string) => () =>
    onSelect(row, select);
  const handleDelete = (row: number) => () => onDelete(row);

  return (
    <Stack direction="row" sx={{ alignItems: 'center' }}>
      <IconButton onClick={handleSelect(row, select)}>
        {select.indexOf(row.toString()) === -1 ? (
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
}

interface ICellChange {
  cell: any;
  row: number;
  col: number;
  value: string | null;
}

export default function ResourceRefs() {
  const [data, setData] = React.useState<ICell[][]>([]);
  const selectSet = useRef(new Set<number>());
  const [select, setSelect] = React.useState('');
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

  const newSelect = () => Array.from(selectSet.current).join(',');

  const handleSelect = (row: number) => {
    if (selectSet.current.has(row)) {
      selectSet.current.delete(row);
    } else {
      selectSet.current.add(row);
    }
    setSelect(newSelect());
  };

  const handleDelete = (row: number) => {
    console.log(`deleting ${row}`);
  };

  const rowCells = (n: number, row: string[], select?: string) =>
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
                select={select || ''}
                onSelect={handleSelect}
                onDelete={handleDelete}
              />
            ),
            width: widths[i],
            readOnly: true,
            className: n === 0 ? 'cTitle' : cClass[i],
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
    setData(newData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (select || data.length > 1) {
      let newData: ICell[][] = [];
      data.forEach((r, i) => {
        newData.push(
          rowCells(
            i,
            r.map((c) => c.value),
            select
          )
        );
      });
      setData(newData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [select]);

  const handleAddRef = () => {};
  const handleAddWord = () => {};
  const handleCancel = () => {};
  const handleSave = () => {};

  const handleValueRenderer = (cell: ICell) =>
    cell.className?.substring(0, 4) === 'book' && bookMap
      ? bookMap[cell.value]
      : cell.value;

  const handleCellsChanged = (changes: Array<ICellChange>) => {
    const newData = data.map((r) => r);
    changes.forEach((c) => {
      newData[c.row][c.col].value = c.value;
    });
    const lastRow = data[data.length - 1];
    if (lastRow[0].value || lastRow[1].value)
      newData.push(rowCells(data.length, emptyRow()));
    setData(newData);
  };

  return (
    <Stack spacing={1}>
      <ButtonGroup>
        <Button onClick={handleAddRef}>Add Ref</Button>
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
