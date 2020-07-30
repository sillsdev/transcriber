import React, { useState, useEffect, useRef } from 'react';
import clsx from 'clsx';
import { useGlobal } from 'reactn';
import { IPlanSheetStrings, ISharedStrings, BookNameMap } from '../model';
import { OptionType } from './ReactSelect';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import {
  Button,
  Menu,
  MenuItem,
  AppBar,
  Checkbox,
  Switch,
  FormControlLabel,
  IconButton,
} from '@material-ui/core';
import SaveIcon from '@material-ui/icons/Save';
import DropDownIcon from '@material-ui/icons/ArrowDropDown';
import AddIcon from '@material-ui/icons/Add';
import UploadIcon from '@material-ui/icons/CloudUpload';
import PlayIcon from '@material-ui/icons/PlayArrow';
import AssignIcon from '@material-ui/icons/People';
import DeleteIcon from '@material-ui/icons/Delete';
import { FaPenNib } from 'react-icons/fa';
import SnackBar from './SnackBar';
import DataSheet from 'react-datasheet';
import Confirm from './AlertDialog';
import BookSelect from './BookSelect';
import 'react-datasheet/lib/react-datasheet.css';
import { isNumber } from 'util';
import { DrawerWidth, HeadHeight } from '../routes/drawer';
import { TabHeight } from './PlanTabs';
import { Online } from '../utils';
import { useInterval } from '../utils/useInterval';
import { useRemoteSave } from '../utils/useRemoteSave';

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
    barDev: {
      left: 0,
      width: '100%',
    },
    content: {
      paddingTop: `calc(${ActionHeight}px + ${theme.spacing(2)}px)`,
      '& .data-grid-container .data-grid .cell': {
        verticalAlign: 'middle',
        textAlign: 'left',
        paddingLeft: theme.spacing(0.5),
        paddingRight: theme.spacing(0.5),
      },
      '& .data-grid-container .data-grid .cell.set': {
        backgroundColor: theme.palette.background.default,
      },
      '& .data-grid-container .data-grid .cell.setp': {
        backgroundColor: theme.palette.background.default,
      },
      '& .data-grid-container .data-grid .cell.num': {
        textAlign: 'center',
      },
      '& .data-grid-container .data-grid .cell.num > input': {
        textAlign: 'center',
        padding: theme.spacing(1),
      },
      '& .data-grid-container .data-grid .cell.pass': {
        textAlign: 'left',
      },
      '& .data-grid-container .data-grid .cell.pass > input': {
        textAlign: 'left',
        padding: theme.spacing(1),
      },
    },
    actions: theme.mixins.gutters({
      paddingBottom: 16,
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'flex-end',
    }) as any,
    actionButton: {
      '& .MuiIconButton-root': {
        color: 'rgba(0,0,0,0.35)',
      },
    },
    lessEmphasis: {
      opacity: 0.6,
    },
    text: {},
    grow: {
      flexGrow: 1,
    },
    button: {
      margin: theme.spacing(1),
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      justifyContent: 'flex-start',
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
  ts: ISharedStrings;
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
  addPassage: (i?: number, before?: boolean) => void;
  addSection: (i?: number) => void;
  lookupBook?: (book: string) => string;
  resequence: () => void;
  inlinePassages: boolean;
  toggleInline: (event: any) => void;
}

export function PlanSheet(props: IProps) {
  const {
    columns,
    rowData,
    t,
    ts,
    bookCol,
    bookSuggestions,
    bookMap,
    lookupBook,
    updateData,
    action,
    addPassage,
    addSection,
    paste,
    resequence,
    inlinePassages,
    toggleInline,
  } = props;
  const classes = useStyles();
  const [projRole] = useGlobal('projRole');
  const [global] = useGlobal();
  const [busy] = useGlobal('remoteBusy');
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
  const suggestionRef = useRef<Array<OptionType>>();
  const listRef = useRef<Array<string>>();
  const saveTimer = React.useRef<NodeJS.Timeout>();
  const [doSave] = useGlobal('doSave');
  const [online, setOnline] = useState(false);
  const [changed, setChanged] = useGlobal('changed');
  const [isDeveloper] = useGlobal('developer');
  const [pasting, setPasting] = useState(false);
  const preventSave = useRef<boolean>(false);
  const currentRow = useRef<number>(-1);
  const sheetRef = useRef<any>();
  const [showRow, setShowRow] = useState(0);
  const [savingGrid, setSavingGrid] = useState<ICell[][]>();
  const [startSave] = useRemoteSave();

  const handleMessageReset = () => {
    setMessage(<></>);
  };
  const SectionSeqCol = 0;
  const PassageSeqCol = 2;

  const isSection = (row: Array<any>) =>
    /^[0-9]+$/.test(row[SectionSeqCol].toString());

  const handleCheck = (row: number) => (e: any) => {
    if (e.target.checked) {
      check.push(row);
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
    startSave();
  };

  const handleSelect = (loc: DataSheet.Selection) => {
    // this autoscroll causes issues TT-1393
    //don't mess with it if we're selecting the checkbox
    //if (loc.start.j > 0 && loc.start.i === loc.end.i) setShowRow(loc.start.i);
    currentRow.current = loc.end.i;
  };

  const handleValueRender = (cell: ICell) =>
    cell.className?.substring(0, 4) === 'book' && bookMap
      ? bookMap[cell.value]
      : cell.value;
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

  const numCol = [1, 3]; // Section num = col 1, Passage num = col 3
  const handleCellsChanged = (changes: Array<IChange>) => {
    const grid = data.map((row: Array<ICell>) => [...row]);
    changes.forEach(({ cell, row, col, value }: IChange) => {
      if (row !== 0 && numCol.includes(col) && value && !isNum(value)) {
        setMessage(<span>{t.nonNumber}</span>);
      } else {
        grid[row][col] = { ...grid[row][col], value };
      }
    });
    if (changes.length > 0) {
      if (doSave) {
        setSavingGrid(grid);
      }
      setChanged(true);
      doUpdate(grid);
      setShowRow(changes[0].row);
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
    //we'll find a section before we get past 0
    while (!isSection(rowData[position.i - 1])) position.i -= 1;
    addSection(position.i - 1);
    setPosition(initialPosition);
  };

  const handlePassageBelow = () => {
    addPassage(position.i - 1, false);
    setPosition(initialPosition);
  };
  const handlePassageBelowSection = () => {
    addPassage(position.i - 1, true);
    setPosition(initialPosition);
  };
  const handleToggleInline = (event: any) => {
    setCheck(Array<number>());
    toggleInline(event);
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

  const cleanClipboard = (clipText: string) => {
    return removeBlanks(clipText).map((line: string) => splitAndTrim(line));
  };

  const parsePaste = (clipBoard: string) => {
    if (projRole !== 'admin') return Array<Array<string>>();
    if (currentRow.current === 0) {
      setPasting(true);
      setMessage(<span>{t.pasting}</span>);
      const retVal = paste(cleanClipboard(clipBoard));
      setPasting(false);
      return retVal;
    }
    return cleanClipboard(clipBoard);
  };
  const handleTablePaste = () => {
    if (typeof navigator.clipboard.readText === 'function') {
      setPasting(true);
      setMessage(<span>{t.pasting}</span>);
      navigator.clipboard.readText().then((clipText) => {
        paste(cleanClipboard(clipText));
        setPasting(false);
      });
    } else {
      setMessage(<span>{t.useCtrlV}</span>);
    }
  };
  const handleResequence = () => {
    resequence();
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
    isNumber(value) || /^[0-9]+$/.test(value);

  const handleAutoSave = () => {
    if (changed && !preventSave.current && !global.alertOpen) {
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

  const tryOnline = () => Online((result) => setOnline(result));

  useEffect(() => {
    if (changed) {
      if (saveTimer.current === undefined) startSaveTimer();
      if (!online) setMessage(<span>{ts.NoSaveOffline}</span>);
    } else {
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
          const isSection = /^[0-9]+$/.test(row[SectionSeqCol].toString());
          const isPassage = /^[0-9]+$/.test(row[PassageSeqCol].toString());
          return [
            {
              value: isDeveloper ? (
                <></>
              ) : (
                <Checkbox
                  data-testid={check.includes(rowIndex) ? 'checked' : 'check'}
                  checked={check.includes(rowIndex)}
                  onChange={handleCheck(rowIndex)}
                />
              ),
              className: isSection ? 'set' : 'pass',
            } as ICell,
          ]
            .concat(
              row.map((e, cellIndex) => {
                return cellIndex !== bookCol || !isPassage
                  ? {
                      value: e,
                      readOnly: isSection
                        ? isPassage
                          ? false
                          : cellIndex > 1
                        : cellIndex <= 1,
                      className:
                        (cellIndex === SectionSeqCol ||
                        cellIndex === PassageSeqCol
                          ? 'num'
                          : 'pass') +
                        (isSection
                          ? !inlinePassages || cellIndex <= 1
                            ? ' set'
                            : ' setp'
                          : ''),
                    }
                  : {
                      value: e,
                      className:
                        'book' + (isSection && inlinePassages ? ' setp' : ''),
                      dataEditor: bookEditor,
                    };
              })
            )
            .concat([
              {
                value: !isDeveloper ? (
                  <></>
                ) : (
                  <div className={classes.actionButton}>
                    <IconButton title={t.upload}>
                      <UploadIcon />
                    </IconButton>
                    <IconButton title={t.play}>
                      <PlayIcon />
                    </IconButton>
                    <IconButton title={t.assign}>
                      <AssignIcon />
                    </IconButton>
                    <IconButton title={t.transcribe}>
                      <FaPenNib />
                    </IconButton>
                    <IconButton title={t.delete}>
                      <DeleteIcon />
                    </IconButton>
                  </div>
                ),
                className: isSection ? 'set' : 'pass',
              } as ICell,
            ]);
        })
      )
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowData, check, bookCol, columns]);

  useEffect(() => {
    if (sheetRef.current && showRow) {
      const tbodyRef =
        sheetRef.current?.firstChild?.firstChild?.firstChild?.childNodes[
          showRow
        ];
      //only scroll if it's not already visible
      if (
        tbodyRef &&
        (tbodyRef.offsetTop < document.documentElement.scrollTop ||
          tbodyRef.offsetTop >
            document.documentElement.scrollTop +
              document.documentElement.clientHeight)
      ) {
        window.scrollTo(0, tbodyRef.offsetTop - 10);
      }
    }
  }, [showRow]);

  useEffect(() => {
    suggestionRef.current = bookSuggestions;
    listRef.current = bookSuggestions
      ? bookSuggestions.map((v) => v.label)
      : [];
  }, [bookSuggestions]);

  useEffect(() => {
    if (!doSave && !busy && savingGrid) {
      setChanged(true);
      doUpdate(savingGrid);
      setSavingGrid(undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doSave, busy, savingGrid]);

  //do this once...
  useEffect(() => tryOnline(), []);
  //and every 30 seconds to warn they can't save
  useInterval(() => tryOnline(), 1000 * 30);

  return (
    <div className={classes.container}>
      <div className={classes.paper}>
        <AppBar
          position="fixed"
          className={clsx(classes.bar, { [classes.barDev]: isDeveloper })}
          color="default"
        >
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
                  key="resequence"
                  aria-label={t.resequence}
                  variant="outlined"
                  color="primary"
                  className={classes.button}
                  disabled={pasting || data.length < 2}
                  onClick={handleResequence}
                >
                  {t.resequence}
                </Button>
                {!isDeveloper && (
                  <>
                    <Button
                      key="action"
                      aria-owns={
                        actionMenuItem !== '' ? 'action-menu' : undefined
                      }
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
                    </Menu>
                  </>
                )}
                <FormControlLabel
                  className={classes.lessEmphasis}
                  control={
                    <Switch
                      checked={inlinePassages}
                      onChange={handleToggleInline}
                      color="primary"
                    />
                  }
                  label={t.inlineToggle}
                />
                <div className={classes.grow}>{'\u00A0'}</div>
                <Button
                  key="save"
                  aria-label={t.save}
                  variant="contained"
                  color={online ? 'primary' : 'secondary'}
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
        <div id="PlanSheet" ref={sheetRef} className={classes.content}>
          <DataSheet
            data={data as any[][]}
            valueRenderer={handleValueRender}
            // dataRenderer={handleDataRender}
            onContextMenu={handleContextMenu}
            onCellsChanged={handleCellsChanged}
            parsePaste={parsePaste}
            onSelect={handleSelect}
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
          {position.i > 0 && isSection(rowData[position.i - 1]) && (
            <MenuItem onClick={handleSectionAbove}>{t.sectionAbove}</MenuItem>
          )}
          {inlinePassages &&
            position.i > 0 &&
            isSection(rowData[position.i - 1]) && (
              <MenuItem onClick={handlePassageBelowSection}>
                {t.passageBelowSection}
              </MenuItem>
            )}
          <MenuItem onClick={handlePassageBelow}>
            {t.passageBelow.replace(
              '{0}',
              position.i > 0
                ? rowData[position.i - 1][PassageSeqCol].toString()
                : ''
            )}
          </MenuItem>{' '}
        </Menu>
      </div>
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
