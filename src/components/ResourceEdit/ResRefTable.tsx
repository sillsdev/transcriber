import { Box, BoxProps, Stack, styled } from '@mui/material';
import React, { useRef } from 'react';
import { BookRef, IResourceStrings, ISharedStrings } from '../../model';
import DataSheet from 'react-datasheet';
import { shallowEqual, useSelector } from 'react-redux';
import { IState } from '../../model';
import BookSelect, { OptionType } from '../BookSelect';
import { ActionRow, AltButton, PriButton } from '../StepEditor';
import Confirm from '../AlertDialog';
import ActionCol from './ResActionCol';
import { sharedResourceSelector, sharedSelector } from '../../selector';

const refPat =
  /(?:\d+\s*(?::\s*(?:\d+(?:\s*-\s*\d+)?,\s*)*\d+(?:\s*-\s*\d+)?)?;\s*)*(?:\d+\s*(?::\s*(?:\d+(?:\s*-\s*\d+)?,\s*)*\d+(?:\s*-\s*\d+)?)?)?/;

const refTest = (s: string) => {
  const m = refPat.exec(s);
  return m && m[0].length === s.length;
};

const Content = styled(Box)<BoxProps>(({ theme }) => ({
  '& .data-grid-container .data-grid .cell': {
    verticalAlign: 'middle',
    textAlign: 'left',
    paddingLeft: theme.spacing(0.5),
    paddingRight: theme.spacing(0.5),
  },
  '& .data-grid-container .data-grid .Err': {
    backgroundColor: 'orange',
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

interface ReferenceTableProps {
  bookData: BookRef[];
  onCommit: (refs: BookRef[]) => void;
  onCancel: () => void;
}

export default function ReferenceTable({
  bookData,
  onCommit,
  onCancel,
}: ReferenceTableProps) {
  const [data, setData] = React.useState<ICell[][]>([]);
  const dataRef = React.useRef<ICell[][]>([]);
  const [confirmRow, setConfirmRow] = React.useState<number>();
  const [confirmErr, setConfirmErr] = React.useState<BookRef[]>();
  const bookMap = useSelector((state: IState) => state.books.map);
  const bookSuggestions = useSelector(
    (state: IState) => state.books.suggestions
  );
  const suggestionRef = useRef<Array<OptionType>>();
  const preventSave = useRef<boolean>(false);
  const t: IResourceStrings = useSelector(sharedResourceSelector, shallowEqual);
  const ts: ISharedStrings = useSelector(sharedSelector, shallowEqual);

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
            className:
              n === 0
                ? 'cTitle'
                : cClass[i] + (!v && row[ColName.Refs] ? ' Err' : ''),
            dataEditor: bookEditor,
          } as ICell)
        : i === ColName.Act && n > 0
        ? ({
            value: <ActionCol row={n} onDelete={handleDelete} />,
            width: widths[i],
            readOnly: true,
            className: n === 0 ? 'cTitle' : cClass[i],
            checked: Boolean(row[ColName.Act]),
          } as ICell)
        : ({
            value: v,
            width: widths[i],
            readOnly: n === 0 || readOnlys[i],
            className:
              n === 0
                ? 'cTitle'
                : cClass[i] +
                  (i === ColName.Refs && v && !refTest(v) ? ' Err' : ''),
          } as ICell)
    );

  const emptyTable = () => [rowCells(0, [t.book, t.references, t.action])];
  const emptyRow = () => ['', '', ''].map((c) => c);

  React.useEffect(() => {
    suggestionRef.current = bookSuggestions;
  }, [bookSuggestions]);

  React.useEffect(() => {
    let newData: ICell[][] = emptyTable();
    bookData.forEach(({ code, refs }, i) =>
      newData.push(rowCells(i + 1, [code, refs, '']))
    );
    newData.push(rowCells(bookData.length + 1, emptyRow()));
    updData(newData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookData]);

  const handleCancel = () => onCancel();
  const handleSave = () => {
    if (preventSave.current) return;
    const refData: BookRef[] = [];
    let error = 0;
    const last = dataRef.current.length - 1;
    dataRef.current.forEach((r, i) => {
      if (
        (i < last && !r[ColName.Book].value) ||
        (i > 0 && r[ColName.Refs].value && !refTest(r[ColName.Refs].value))
      ) {
        error++;
      } else if (i > 0 && r[ColName.Book].value) {
        refData.push({
          code: r[ColName.Book].value,
          refs: r[ColName.Refs].value,
        });
      }
    });
    if (error > 0) {
      setConfirmErr(refData);
    } else {
      onCommit(refData);
    }
  };
  const saveConfirm = () => {
    if (confirmErr) onCommit(confirmErr);
    setConfirmErr(undefined);
  };
  const saveRejected = () => {
    setConfirmErr(undefined);
  };

  const handleValueRenderer = (cell: ICell) =>
    cell.className?.substring(0, 4) === 'book' && bookMap
      ? bookMap[cell.value]
      : cell.value;

  const handleCellsChanged = (changes: Array<ICellChange>) => {
    const newData = dataRef.current.map((r) => r);
    changes.forEach((c) => {
      const bookCng =
        c.col === ColName.Book &&
        Boolean(c.value) !== Boolean(newData[c.row][c.col].value);
      newData[c.row][c.col].value = c.value;
      if (bookCng || c.col === ColName.Refs)
        // Turns error background on and off
        newData[c.row] = rowCells(
          c.row,
          newData[c.row].map((i) => i.value)
        );
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
      <Content>
        <DataSheet
          data={data}
          valueRenderer={handleValueRenderer}
          onCellsChanged={handleCellsChanged}
        />
      </Content>
      <ActionRow>
        <AltButton onClick={handleCancel}>{ts.cancel}</AltButton>
        <PriButton onClick={handleSave} disabled={data.length <= 2}>
          {ts.save}
        </PriButton>
      </ActionRow>
      {confirmRow && (
        <Confirm
          text={t.deleteConfirm.replace('{0}', confirmMsg(confirmRow))}
          yesResponse={deleteConfirmed}
          noResponse={deleteRejected}
        />
      )}
      {confirmErr && (
        <Confirm
          text={t.errorData}
          yesResponse={saveConfirm}
          noResponse={saveRejected}
        />
      )}
    </Stack>
  );
}
