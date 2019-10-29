import React, { useState, useEffect, useRef } from 'react';
import { useGlobal } from 'reactn';
import { IPlanSheetStrings, BookNameMap } from '../model';
import { OptionType } from './ReactSelect';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import { Button, Menu, MenuItem } from '@material-ui/core';
import CheckBox from '@material-ui/core/Checkbox';
import SaveIcon from '@material-ui/icons/Save';
import DropDownIcon from '@material-ui/icons/ArrowDropDown';
import AddIcon from '@material-ui/icons/Add';
import SnackBar from './SnackBar';
import DataSheet from 'react-datasheet';
import PassageMedia from './PassageMedia';
import Confirm from './AlertDialog';
import BookSelect from './ReactSelect';
import 'react-datasheet/lib/react-datasheet.css';
import './PlanSheet.css';
import { isNumber } from 'util';
import SheetText from './SheetText';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    container: {
      display: 'flex',
    },
    paper: {},
    actions: theme.mixins.gutters({
      paddingBottom: 16,
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'flex-end',
    }),
    text: {},
    grow: {
      flexGrow: 1,
    },
    button: {
      margin: theme.spacing(1),
    },
    icon: {
      marginLeft: theme.spacing(1),
    },
  })
);

interface ICell {
  value: any;
  readOnly?: boolean;
  width?: number;
  className?: string;
}

interface IChange {
  cell: any;
  row: number;
  col: number;
  value: string | null;
}

interface IStateProps {
  t: IPlanSheetStrings;
}

interface IProps extends IStateProps {
  columns: Array<ICell>;
  rowData: Array<Array<string | number>>;
  bookCol: number;
  bookSuggestions?: OptionType[];
  bookMap?: BookNameMap;
  updateData: (rows: string[][]) => void;
  save: (rows: string[][]) => void;
  paste: (rows: string[][]) => string[][];
  action: (what: string, where: number[]) => boolean;
  addPassage: () => void;
  addSection: () => void;
  lookupBook?: (book: string) => string;
  setChanged?: (v: boolean) => void;
}

export function PlanSheet(props: IProps) {
  const {
    columns,
    rowData,
    t,
    bookCol,
    bookSuggestions,
    bookMap,
    lookupBook,
    updateData,
    save,
    action,
    addPassage,
    addSection,
    paste,
    setChanged,
  } = props;
  const classes = useStyles();
  const [projRole] = useGlobal('projRole');
  const [message, setMessage] = useState(<></>);
  const [data, setData] = useState(Array<Array<ICell>>());
  const [actionMenuItem, setActionMenuItem] = useState(null);
  const [check, setCheck] = useState(Array<number>());
  const [confirmAction, setConfirmAction] = useState('');
  const [passageMediaVisible, setPassageMediaVisible] = useState(false);
  const suggestionRef = useRef<Array<OptionType>>();
  const listRef = useRef<Array<string>>();
  const blurRef = useRef<() => void>();

  const handleMessageReset = () => {
    setMessage(<></>);
  };
  const handleCheck = (row: number) => (e: any) => {
    if (e.target.checked) {
      check.push(row);
      if (/^[0-9]+$/.test(rowData[row][0].toString())) {
        do {
          row += 1;
          if (
            row === rowData.length ||
            /^[0-9]+$/.test(rowData[row][0].toString())
          ) {
            break;
          }
          check.push(row);
        } while (true);
      }
      setCheck([...check]);
    } else {
      setCheck(check.filter(listIndex => listIndex !== row));
    }
  };
  const handleAddSection = () => {
    addSection();
  };
  const handleAddPassage = () => {
    addPassage();
  };
  const justData = (data: Array<Array<ICell>>) => {
    return data
      .filter((row, rowIndex) => rowIndex > 0)
      .map(row =>
        row.filter((row, rowIndex) => rowIndex > 0).map(col => col.value)
      );
  };
  const handleSave = () => {
    setMessage(<span>{t.saving}</span>);
    if (save != null) {
      save(justData(data));
    }
  };
  const handleValueRender = (cell: ICell) =>
    cell.className === 'book' && bookMap ? bookMap[cell.value] : cell.value;
  const handleMenu = (e: any) => setActionMenuItem(e.currentTarget);
  const handleConfirmAction = (what: string) => (e: any) => {
    setActionMenuItem(null);
    if (!/Close/i.test(what)) {
      if (check.length === 0) {
        setMessage(<span>{t.selectRows.replace('{0}', what)}</span>);
      } else {
        setConfirmAction(what);
      }
    }
  };
  const handleActionConfirmed = () => {
    if (action != null) {
      if (action(confirmAction, check)) {
        setCheck(Array<number>());
      }
    }
    setConfirmAction('');
  };
  const handleActionRefused = () => {
    setConfirmAction('');
  };
  const handlePassageMedia = (status: boolean) => (e: any) => {
    setActionMenuItem(null);
    setPassageMediaVisible(status);
  };

  const handleCellsChanged = (changes: Array<IChange>) => {
    const grid = data.map((row: Array<ICell>) => [...row]);
    changes.forEach(({ cell, row, col, value }: IChange) => {
      grid[row][col] = { ...grid[row][col], value };
    });
    if (changes.length > 0) {
      // setData(grid);
      updateData(
        justData(grid).map(row =>
          row.map((cell, cellIndex) =>
            cellIndex !== bookCol && lookupBook !== null
              ? cell
              : lookupBook && lookupBook(cell)
          )
        )
      );
    }
  };

  const handleContextMenu = (e: MouseEvent, cell: any) =>
    cell.readOnly ? e.preventDefault() : null;

  const handlePaste = (clipBoard: string) => {
    if (projRole !== 'admin') return Array<Array<string>>();
    const blankLines = /\r?\n\t*\r?\n/;
    const chunks = clipBoard.split(blankLines);
    const lines = chunks
      .join('\n')
      .replace(/\r?\n$/, '')
      .split('\n');
    if (paste) return paste(lines.map(clipBoard => clipBoard.split('\t')));
    return lines.map(clipBoard => clipBoard.split('\t'));
  };

  const handleUp = () => {
    if (blurRef.current) {
      blurRef.current();
      blurRef.current = undefined;
    }
  };

  const cellRender = (props: any) => <td {...props} onMouseUp={handleUp} />;

  const bookEditor = (props: any) => {
    if (projRole !== 'admin') return <></>;
    if (setChanged) setChanged(true);
    return (
      <BookSelect
        suggestions={suggestionRef.current ? suggestionRef.current : []}
        {...props}
        current={(listRef.current ? listRef.current : []).indexOf(props.value)}
      />
    );
  };

  const handleSetCommit = (method: () => void) => {
    blurRef.current = method;
  };

  const textEditor = (props: any) => {
    if (projRole !== 'admin') return <></>;
    if (setChanged) setChanged(true);
    return (
      <SheetText
        {...props}
        initValue={props.value}
        setCommit={handleSetCommit}
      />
    );
  };

  const isNum = (value: string | number) =>
    isNumber(value) || /^[0-9]$/.test(value);

  useEffect(() => {
    setData(
      [
        [{ value: '', readOnly: true } as ICell].concat(
          columns.map(col => {
            return { ...col, readOnly: true };
          })
        ),
      ].concat(
        rowData.map((row, rowIndex) => {
          const isSection = /^[0-9]+$/.test(row[0].toString());
          return [
            {
              value: (
                <CheckBox
                  data-testid={check.includes(rowIndex) ? 'checked' : 'check'}
                  checked={check.includes(rowIndex)}
                  onChange={handleCheck(rowIndex)}
                />
              ),
              className: isSection ? 'set' : 'pass',
            } as ICell,
          ].concat(
            row.map((e, cellIndex) => {
              return cellIndex !== bookCol || isSection
                ? {
                    value: e,
                    dataEditor: textEditor,
                    className:
                      (isNum(e) ? 'num' : 'pass') + (isSection ? ' set' : ''),
                  }
                : {
                    value: e,
                    className: 'book',
                    dataEditor: bookEditor,
                  };
            })
          );
        })
      )
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowData, check, bookCol]);

  useEffect(() => {
    suggestionRef.current = bookSuggestions;
    listRef.current = bookSuggestions ? bookSuggestions.map(v => v.label) : [];
  }, [bookSuggestions]);

  return (
    <div className={classes.container}>
      <div className={classes.paper}>
        <div className={classes.actions}>
          {projRole === 'admin' && (
            <>
              <Button
                key="addSection"
                aria-label={t.addSection}
                variant="outlined"
                color="primary"
                className={classes.button}
                onClick={handleAddSection}
              >
                {t.addSection}
                <AddIcon className={classes.icon} />
              </Button>
              <Button
                key="addPassage"
                aria-label={t.addPassage}
                variant="outlined"
                color="primary"
                className={classes.button}
                onClick={handleAddPassage}
              >
                {t.addPassage}
                <AddIcon className={classes.icon} />
              </Button>
              <Button
                key="action"
                aria-owns={actionMenuItem !== '' ? 'action-menu' : undefined}
                aria-label={t.action}
                variant="outlined"
                color="primary"
                className={classes.button}
                onClick={handleMenu}
              >
                {t.action}
                <DropDownIcon className={classes.icon} />
              </Button>
              <Menu
                id="action-menu"
                anchorEl={actionMenuItem}
                open={Boolean(actionMenuItem)}
                onClose={handleConfirmAction('Close')}
              >
                <MenuItem onClick={handleConfirmAction('Delete')}>
                  {t.delete}
                </MenuItem>
                <MenuItem onClick={handlePassageMedia(true)}>
                  {t.attachMedia}
                </MenuItem>
              </Menu>
              <div className={classes.grow}>{'\u00A0'}</div>
              <Button
                key="save"
                aria-label={t.save}
                variant="contained"
                color="primary"
                className={classes.button}
                onClick={handleSave}
              >
                {t.save}
                <SaveIcon className={classes.icon} />
              </Button>
            </>
          )}
        </div>

        <DataSheet
          data={data as any[][]}
          valueRenderer={handleValueRender}
          // dataRenderer={handleDataRender}
          onContextMenu={handleContextMenu}
          onCellsChanged={handleCellsChanged}
          parsePaste={handlePaste}
          cellRenderer={cellRender}
        />
      </div>
      <PassageMedia
        visible={passageMediaVisible}
        closeMethod={handlePassageMedia(false)}
      />
      {confirmAction !== '' ? (
        <Confirm
          text={confirmAction + ' ' + check.length + ' Item(s). Are you sure?'}
          yesResponse={handleActionConfirmed}
          noResponse={handleActionRefused}
        />
      ) : (
        <></>
      )}
      <SnackBar {...props} message={message} reset={handleMessageReset} />
    </div>
  );
}

export default PlanSheet;
