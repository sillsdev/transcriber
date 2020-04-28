import React, { useState, useEffect, useRef } from 'react';
import { useGlobal } from 'reactn';
import { IPlanSheetStrings, BookNameMap } from '../model';
import { OptionType } from './ReactSelect';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import { Button, Menu, MenuItem, AppBar, Checkbox } from '@material-ui/core';
import SaveIcon from '@material-ui/icons/Save';
import DropDownIcon from '@material-ui/icons/ArrowDropDown';
import AddIcon from '@material-ui/icons/Add';
import SnackBar from './SnackBar';
import DataSheet from 'react-datasheet';
import PassageMedia from './PassageMedia';
import Confirm from './AlertDialog';
import BookSelect from './BookSelect';
import 'react-datasheet/lib/react-datasheet.css';
import './PlanSheet.css';
import { isNumber } from 'util';
import { DrawerWidth, HeadHeight } from '../routes/drawer';
import { TabHeight } from './PlanTabs';

const ActionHeight = 52;

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    container: {
      display: 'flex',
    },
    paper: {},
    bar: {
      top: `calc(${HeadHeight}px + ${TabHeight}px)`,
      left: `${DrawerWidth}px`,
      height: `${ActionHeight}px`,
      width: `calc(100% - ${DrawerWidth}px)`,
    },
    content: {
      paddingTop: `calc(${ActionHeight}px + ${theme.spacing(2)}px)`,
    },
    actions: theme.mixins.gutters({
      paddingBottom: 16,
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'flex-end',
    }) as any,
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

const initialPosition = {
  mouseX: null,
  mouseY: null,
  i: 0,
  j: 0,
};

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
  paste: (rows: string[][]) => string[][];
  action: (what: string, where: number[]) => boolean;
  addPassage: (i?: number) => void;
  addSection: (i?: number) => void;
  lookupBook?: (book: string) => string;
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
    action,
    addPassage,
    addSection,
    paste,
  } = props;
  const classes = useStyles();
  const [projRole] = useGlobal('projRole');
  const [message, setMessage] = useState(<></>);
  const [position, setPosition] = useState<{
    mouseX: null | number;
    mouseY: null | number;
    i: number;
    j: number;
  }>(initialPosition);
  const [data, setData] = useState(Array<Array<ICell>>());
  const [actionMenuItem, setActionMenuItem] = useState(null);
  const [check, setCheck] = useState(Array<number>());
  const [confirmAction, setConfirmAction] = useState('');
  const [passageMediaVisible, setPassageMediaVisible] = useState(false);
  const suggestionRef = useRef<Array<OptionType>>();
  const listRef = useRef<Array<string>>();
  const saveTimer = React.useRef<NodeJS.Timeout>();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [doSave, setDoSave] = useGlobal('doSave');
  const [changed, setChanged] = useGlobal('changed');
  const [pasting, setPasting] = useState(false);
  const preventSave = useRef<boolean>(false);

  const handleMessageReset = () => {
    setMessage(<></>);
  };
  const handleCheck = (row: number) => (e: any) => {
    if (e.target.checked) {
      check.push(row);
      const isSection = (row: Array<any>) => /^[0-9]+$/.test(row[0].toString());
      if (isSection(rowData[row])) {
        do {
          row += 1;
          if (row === rowData.length || isSection(rowData[row])) {
            break;
          }
          check.push(row);
        } while (true);
      }
      setCheck([...check]);
    } else {
      setCheck(check.filter((listIndex) => listIndex !== row));
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
      .map((row) =>
        row.filter((row, rowIndex) => rowIndex > 0).map((col) => col.value)
      );
  };
  const handleSave = () => {
    setChanged(false);
    setMessage(<span>{t.saving}</span>);
    setDoSave(true);
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

  const doUpdate = (grid: ICell[][]) => {
    updateData(
      justData(grid).map((row) =>
        row.map((cell, cellIndex) =>
          cellIndex !== bookCol && lookupBook !== null
            ? cell
            : lookupBook && lookupBook(cell)
        )
      )
    );
  };

  const handleCellsChanged = (changes: Array<IChange>) => {
    const grid = data.map((row: Array<ICell>) => [...row]);
    changes.forEach(({ cell, row, col, value }: IChange) => {
      grid[row][col] = { ...grid[row][col], value };
    });
    if (changes.length > 0) {
      setChanged(true);
      doUpdate(grid);
    }
  };

  const handleContextMenu = (
    e: MouseEvent,
    cell: any,
    i: number,
    j: number
  ) => {
    e.preventDefault();
    if (i > 0) {
      setPosition({ mouseX: e.clientX - 2, mouseY: e.clientY - 4, i, j });
    }
  };

  const handleNoContextMenu = () => setPosition(initialPosition);

  const handleSectionAbove = () => {
    addSection(position.i - 1);
    setPosition(initialPosition);
  };

  const handlePassageAbove = () => {
    addPassage(position.i - 1);
    setPosition(initialPosition);
  };

  const removeBlanks = (clipBoard: string) => {
    const blankLines = /\r?\n\t*\r?\n/;
    const chunks = clipBoard.split(blankLines);
    return chunks
      .join('\n')
      .replace(/\r?\n$/, '')
      .split('\n');
  };
  const splitAndTrim = (clipBoard: string): string[] =>
    clipBoard.split('\t').map((v) => (typeof v === 'string' ? v.trim() : v));

  const parsePaste = (clipBoard: string) => {
    if (projRole !== 'admin') return Array<Array<string>>();
    return removeBlanks(clipBoard).map((line: string) => splitAndTrim(line));
  };
  const handleTablePaste = () => {
    setPasting(true);
    setMessage(<span>Pasting</span>);
    navigator.clipboard.readText().then((clipText) => {
      paste(removeBlanks(clipText).map((line) => splitAndTrim(line)));
      setPasting(false);
    });
  };

  const handleSetPreventSave = (val: boolean) => {
    preventSave.current = val;
  };

  const bookEditor = (props: any) => {
    if (projRole !== 'admin') return <></>;
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
  const isNum = (value: string | number) =>
    isNumber(value) || /^[0-9]$/.test(value);
  const handleAutoSave = () => {
    if (changed && !preventSave.current) {
      handleSave();
    } else {
      startSaveTimer();
    }
  };
  const startSaveTimer = () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      handleAutoSave();
    }, 1000 * 30);
  };
  useEffect(() => {
    if (changed && saveTimer.current === undefined) startSaveTimer();
    else {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = undefined;
    }
    return () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        saveTimer.current = undefined;
      }
    };
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [changed]);

  useEffect(() => {
    setData(
      [
        [{ value: '', readOnly: true } as ICell].concat(
          columns.map((col) => {
            return { ...col, readOnly: true };
          })
        ),
      ].concat(
        rowData.map((row, rowIndex) => {
          const isSection = /^[0-9]+$/.test(row[0].toString());
          return [
            {
              value: (
                <Checkbox
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
                    readOnly: isSection ? cellIndex > 1 : cellIndex <= 1,
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
    listRef.current = bookSuggestions
      ? bookSuggestions.map((v) => v.label)
      : [];
  }, [bookSuggestions]);
  //console.log('plansheet render', new Date().toLocaleTimeString());
  return (
    <div className={classes.container}>
      <div className={classes.paper}>
        <AppBar position="fixed" className={classes.bar} color="default">
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
                  disabled={data.length < 2}
                >
                  {t.addPassage}
                  <AddIcon className={classes.icon} />
                </Button>
                <Button
                  key="importExcel"
                  aria-label={t.tablePaste}
                  variant="outlined"
                  color="primary"
                  className={classes.button}
                  disabled={pasting}
                  onClick={handleTablePaste}
                >
                  {t.tablePaste}
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
                  disabled={!changed}
                >
                  {t.save}
                  <SaveIcon className={classes.icon} />
                </Button>
              </>
            )}
          </div>
        </AppBar>
        <div className={classes.content}>
          <DataSheet
            data={data as any[][]}
            valueRenderer={handleValueRender}
            // dataRenderer={handleDataRender}
            onContextMenu={handleContextMenu}
            onCellsChanged={handleCellsChanged}
            parsePaste={parsePaste}
          />
        </div>
        <Menu
          keepMounted
          open={position.mouseY !== null && projRole === 'admin'}
          onClose={handleNoContextMenu}
          anchorReference="anchorPosition"
          anchorPosition={
            position.mouseY !== null && position.mouseX !== null
              ? { top: position.mouseY, left: position.mouseX }
              : undefined
          }
        >
          <MenuItem onClick={handleSectionAbove}>{t.sectionAbove}</MenuItem>
          <MenuItem onClick={handlePassageAbove} disabled={position.i < 2}>
            {t.passageAbove}
          </MenuItem>
        </Menu>
      </div>
      <PassageMedia
        visible={passageMediaVisible}
        closeMethod={handlePassageMedia(false)}
      />
      {confirmAction !== '' ? (
        <Confirm
          text={t.confirm
            .replace('{0}', confirmAction)
            .replace('{1}', check.length.toString())}
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
