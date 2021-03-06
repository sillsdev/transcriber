import React, { useState, useEffect, useRef } from 'react';
import { useGlobal } from 'reactn';
import {
  IPlanSheetStrings,
  ISharedStrings,
  BookNameMap,
  OptionType,
} from '../model';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import { Button, Menu, MenuItem, AppBar } from '@material-ui/core';
import SaveIcon from '@material-ui/icons/Save';
import AddIcon from '@material-ui/icons/Add';
import { useSnackBar } from '../hoc/SnackBar';
import DataSheet from 'react-datasheet';
import Confirm from './AlertDialog';
import BookSelect from './BookSelect';
import { ProjButtons, LastEdit } from '../control';
import 'react-datasheet/lib/react-datasheet.css';
import { refMatch } from '../utils';
import { useOrganizedBy } from '../crud';
import { useRemoteSave } from '../utils/useRemoteSave';
import TaskAvatar from './TaskAvatar';
import MediaPlayer from './MediaPlayer';
import { PlanContext } from '../context/PlanContext';
import Auth from '../auth/Auth';
import { IRowInfo } from './ScriptureTable';
import { TranscriberIcon, EditorIcon } from './RoleIcons';
import PlanActions from './PlanActions';
import { ActionHeight, tabActions, actionBar } from './PlanTabs';
import PlanAudioActions from './PlanAudioActions';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    container: {
      display: 'flex',
    },
    paper: {},
    bar: actionBar,
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
      '& .data-grid-container .data-grid .cell.setpErr': {
        backgroundColor: theme.palette.warning.main,
      },
      '& .data-grid-container .data-grid .cell.num': {
        textAlign: 'center',
      },
      '& .data-grid-container .data-grid .cell.num > input': {
        textAlign: 'center',
        padding: theme.spacing(1),
      },
      '& .data-grid-container .data-grid .cell.pass': {
        backgroundColor: theme.palette.background.paper,
        textAlign: 'left',
      },
      '& .data-grid-container .data-grid .cell.passErr': {
        backgroundColor: theme.palette.warning.main,
        textAlign: 'left',
      },
      '& .data-grid-container .data-grid .cell.pass > input': {
        backgroundColor: theme.palette.background.paper,
        textAlign: 'left',
        padding: theme.spacing(1),
      },
      '& tr td:first-child > span': {
        display: 'flex!important',
        justifyContent: 'center',
      },
      '& tr td:nth-child(2) > span': {
        display: 'flex!important',
        justifyContent: 'center',
      },
    },
    actions: theme.mixins.gutters(tabActions) as any,
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
    warning: {
      backgroundColor: theme.palette.warning.main,
      display: 'flex',
      justifyContent: 'space-around',
      padding: theme.spacing(1),
      marginBottom: theme.spacing(1),
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
  rowInfo: Array<IRowInfo>;
  bookCol: number;
  bookSuggestions?: OptionType[];
  bookMap?: BookNameMap;
  lastSaved?: string;
  updateData: (rows: string[][]) => void;
  paste: (rows: string[][]) => string[][];
  action: (what: string, where: number[]) => Promise<boolean>;
  addPassage: (i?: number, before?: boolean) => void;
  addSection: (i?: number) => void;
  lookupBook: (book: string) => string;
  resequence: () => void;
  inlinePassages: boolean;
  onTranscribe: (i: number) => void;
  onAssign: (where: number[]) => () => void;
  onUpload: (i: number) => () => void;
  onRecord: (i: number) => void;
  auth: Auth;
}

export function PlanSheet(props: IProps) {
  const {
    columns,
    rowData,
    rowInfo,
    t,
    ts,
    lastSaved,
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
    auth,
    onTranscribe,
  } = props;
  const classes = useStyles();
  const ctx = React.useContext(PlanContext);
  const { projButtonStr, connected, readonly } = ctx.state;
  const [isOffline] = useGlobal('offline');
  const [projRole] = useGlobal('projRole');
  const [global] = useGlobal();
  const [busy] = useGlobal('remoteBusy');
  const { showMessage } = useSnackBar();
  const [position, setPosition] = useState<{
    mouseX: null | number;
    mouseY: null | number;
    i: number;
    j: number;
  }>(initialPosition);
  const [data, setData] = useState(Array<Array<ICell>>());
  const [check, setCheck] = useState(Array<number>());
  const [confirmAction, setConfirmAction] = useState('');
  const suggestionRef = useRef<Array<OptionType>>();
  const saveTimer = React.useRef<NodeJS.Timeout>();
  const [doSave] = useGlobal('doSave');
  const [changed, setChanged] = useGlobal('changed');
  const [offlineOnly] = useGlobal('offlineOnly');
  const [pasting, setPasting] = useState(false);
  const preventSave = useRef<boolean>(false);
  const currentRow = useRef<number>(-1);
  const sheetRef = useRef<any>();
  const [showRow, setShowRow] = useState(0);
  const { getOrganizedBy } = useOrganizedBy();
  const [organizedBy] = useState(getOrganizedBy(true));
  const [savingGrid, setSavingGrid] = useState<ICell[][]>();
  const [startSave] = useRemoteSave();
  const [srcMediaId, setSrcMediaId] = useState('');
  const [warning, setWarning] = useState<string>();
  const [deleting, setDeleting] = useState(false);
  const SectionSeqCol = 0;
  const PassageSeqCol = 2;
  const LastCol = bookCol > 0 ? 6 : 5;

  const isValidNumber = (val: any) =>
    val === undefined ? false : /^[0-9]+$/.test(val.toString());

  const isSection = (row: any[]) => isValidNumber(row[SectionSeqCol]);

  const isPassage = (row: any[]) => isValidNumber(row[PassageSeqCol]);

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
        row.filter((row, rowIndex) => rowIndex > 2).map((col) => col.value)
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

  const handleConfirmDelete = (rowIndex: number) => () => {
    const toDelete = [rowIndex];
    if (isSection(rowData[rowIndex])) {
      var psg = rowIndex + 1;
      while (psg < rowData.length && !isSection(rowData[psg])) {
        toDelete.push(psg);
        psg++;
      }
    }
    setCheck(toDelete);
    setConfirmAction('Delete');
  };

  const handleActionConfirmed = () => {
    if (action != null) {
      setDeleting(true);
      action(confirmAction, check).then((result) => {
        setCheck(Array<number>());
        setDeleting(false);
      });
    }
    setConfirmAction('');
  };

  const handleActionRefused = () => {
    setConfirmAction('');
  };

  const handlePlayStatus = (mediaId: string) => {
    setSrcMediaId(mediaId);
  };

  const handleTranscribe = (i: number) => () => {
    setSrcMediaId('');
    onTranscribe(i);
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

  const numCol = [3, 5]; // Section num = col 2, Passage num = col 4
  const handleCellsChanged = (changes: Array<IChange>) => {
    if (readonly) return; //readonly
    const grid = data.map((row: Array<ICell>) => [...row]);
    changes.forEach(({ cell, row, col, value }: IChange) => {
      if (row !== 0 && numCol.includes(col) && value && !isNum(value)) {
        showMessage(t.nonNumber);
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
    if (i > 0 && (!isOffline || offlineOnly) && projRole === 'admin') {
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
    if (readonly) return Array<Array<string>>();
    if (currentRow.current === 0) {
      setPasting(true);
      showMessage(t.pasting);
      const retVal = paste(cleanClipboard(clipBoard));
      setPasting(false);
      return retVal;
    }
    return cleanClipboard(clipBoard);
  };
  const handleTablePaste = () => {
    if (typeof navigator.clipboard.readText === 'function') {
      setPasting(true);
      showMessage(t.pasting);
      navigator.clipboard.readText().then((clipText) => {
        paste(cleanClipboard(clipText));
        setPasting(false);
      });
    } else {
      showMessage(t.useCtrlV);
    }
  };
  const handleResequence = () => {
    resequence();
  };

  const handleSetPreventSave = (val: boolean) => {
    preventSave.current = val;
  };

  const bookEditor = (props: any) => {
    if (readonly) return <></>;
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
    typeof value === 'number' || /^[0-9]+$/.test(value);

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

  useEffect(() => {
    if (changed) {
      if (saveTimer.current === undefined) startSaveTimer();
      if (!connected && !offlineOnly) showMessage(ts.NoSaveOffline);
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

  const MemoizedTaskAvatar = React.memo(TaskAvatar);

  const refErrTest = (ref: any) => typeof ref !== 'string' || !refMatch(ref);

  useEffect(() => {
    if (rowData.length !== rowInfo.length) {
      setData([]);
    } else {
      const refCol = bookCol + 1;

      let data = [
        [
          {
            value: <EditorIcon />,
            readOnly: true,
          } as ICell,
          {
            value: <TranscriberIcon />,
            readOnly: true,
          } as ICell,
          {
            value: t.audio,
            readOnly: true,
            width: projRole === 'admin' ? 50 : 20,
          } as ICell,
        ].concat(
          columns.map((col) => {
            return { ...col, readOnly: true };
          })
        ),
      ].concat(
        rowData.map((row, rowIndex) => {
          const section = isSection(row);
          const passage = isPassage(row);
          return [
            {
              value: (
                <MemoizedTaskAvatar assigned={rowInfo[rowIndex].editor || ''} />
              ),
              readOnly: true,
              className: section ? 'set' + (passage ? 'p' : '') : 'pass',
            } as ICell,
            {
              value: (
                <MemoizedTaskAvatar
                  assigned={rowInfo[rowIndex].transcriber || ''}
                />
              ),
              readOnly: true,
              className: section ? 'set' + (passage ? 'p' : '') : 'pass',
            } as ICell,
          ]
            .concat(
              passage
                ? [
                    {
                      value: (
                        <PlanAudioActions
                          {...props}
                          rowIndex={rowIndex}
                          isPassage={passage}
                          mediaId={rowInfo[rowIndex].mediaId}
                          onPlayStatus={handlePlayStatus}
                          online={connected || offlineOnly}
                          readonly={readonly}
                          isPlaying={
                            rowInfo[rowIndex].mediaId !== '' &&
                            srcMediaId === rowInfo[rowIndex].mediaId
                          }
                        />
                      ),
                      readOnly: true,
                      className: section
                        ? 'set' + (passage ? 'p' : ' ')
                        : 'pass',
                    } as ICell,
                  ]
                : [
                    {
                      value: <></>,
                      readOnly: true,
                      className: 'set',
                    } as ICell,
                  ]
            )
            .concat(
              row.slice(0, LastCol).map((e, cellIndex) => {
                return cellIndex === bookCol && passage
                  ? {
                      value: e,
                      readOnly: isOffline && !offlineOnly,
                      className: 'book ' + (section ? ' setp' : 'pass'),
                      dataEditor: bookEditor,
                    }
                  : {
                      value: e,
                      readOnly:
                        (isOffline && !offlineOnly) ||
                        (section
                          ? passage
                            ? false
                            : cellIndex > 1
                          : cellIndex <= 1),
                      className:
                        (cellIndex === SectionSeqCol ||
                        cellIndex === PassageSeqCol
                          ? 'num '
                          : '') +
                        (section ? 'set' + (passage ? 'p' : '') : 'pass') +
                        (refCol && refCol === cellIndex && refErrTest(e)
                          ? 'Err'
                          : ''),
                    };
              })
            )
            .concat([
              {
                value: (
                  <PlanActions
                    {...props}
                    rowIndex={rowIndex}
                    isSection={section}
                    isPassage={passage}
                    mediaId={rowInfo[rowIndex].mediaId}
                    onDelete={handleConfirmDelete}
                    onTranscribe={handleTranscribe}
                    readonly={readonly}
                    canAssign={projRole === 'admin'}
                    canDelete={projRole === 'admin'}
                    noDeleteNow={deleting}
                  />
                ),
                readOnly: true,
                className: section ? 'set' + (passage ? 'p' : ' ') : 'pass',
              } as ICell,
            ]);
        })
      );

      let refErr = false;
      if (refCol > 0) {
        rowData.forEach((row) => {
          if (isPassage(row)) {
            const ref = row[refCol];
            if (refErrTest(ref)) refErr = true;
          }
        });
      }
      if (refErr && !warning) setWarning(t.refErr);
      else if (!refErr && warning) setWarning(undefined);
      setData(data);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowData, rowInfo, bookCol, columns, srcMediaId, projRole]);

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
  }, [bookSuggestions]);

  useEffect(() => {
    if (!doSave && !busy && savingGrid) {
      setChanged(true);
      doUpdate(savingGrid);
      setSavingGrid(undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doSave, busy, savingGrid]);

  const playEnded = () => {
    setSrcMediaId('');
  };
  return (
    <div className={classes.container}>
      <div className={classes.paper}>
        {projRole === 'admin' && (
          <AppBar position="fixed" className={classes.bar} color="default">
            <div className={classes.actions}>
              <>
                <Button
                  id="planSheetAddSec"
                  key="addSection"
                  aria-label={t.addSection}
                  variant="outlined"
                  color="primary"
                  className={classes.button}
                  onClick={handleAddSection}
                  disabled={readonly}
                >
                  {t.addSection.replace('{0}', organizedBy)}
                  <AddIcon className={classes.icon} />
                </Button>
                {!inlinePassages && (
                  <Button
                    id="planSheetAddPass"
                    key="addPassage"
                    aria-label={t.addPassage}
                    variant="outlined"
                    color="primary"
                    className={classes.button}
                    onClick={handleAddPassage}
                    disabled={data.length < 2 || readonly}
                  >
                    {t.addPassage}
                    <AddIcon className={classes.icon} />
                  </Button>
                )}
                <Button
                  id="planSheetImp"
                  key="importExcel"
                  aria-label={t.tablePaste}
                  variant="outlined"
                  color="primary"
                  className={classes.button}
                  disabled={pasting || readonly}
                  onClick={handleTablePaste}
                >
                  {t.tablePaste}
                </Button>
                <Button
                  id="planSheetReseq"
                  key="resequence"
                  aria-label={t.resequence}
                  variant="outlined"
                  color="primary"
                  className={classes.button}
                  disabled={pasting || data.length < 2 || readonly}
                  onClick={handleResequence}
                >
                  {t.resequence}
                </Button>

                <ProjButtons
                  {...props}
                  noImExport={pasting}
                  noIntegrate={pasting || data.length < 2}
                  t={projButtonStr}
                />
                <div className={classes.grow}>{'\u00A0'}</div>
                <LastEdit when={lastSaved} t={ts} />
                <Button
                  id="planSheetSave"
                  key="save"
                  aria-label={t.save}
                  variant="contained"
                  color={connected ? 'primary' : 'secondary'}
                  className={classes.button}
                  onClick={handleSave}
                  disabled={doSave || !changed}
                >
                  {t.save}
                  <SaveIcon className={classes.icon} />
                </Button>
              </>
            </div>
          </AppBar>
        )}
        <div id="PlanSheet" ref={sheetRef} className={classes.content}>
          {warning && <div className={classes.warning}>{warning}</div>}
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
            <MenuItem id="secAbove" onClick={handleSectionAbove}>
              {t.sectionAbove.replace('{0}', organizedBy)}
            </MenuItem>
          )}

          {!inlinePassages && (
            <MenuItem id="passBelow" onClick={handlePassageBelow}>
              {t.passageBelow.replace(
                '{0}',
                position.i > 0
                  ? rowData[position.i - 1][PassageSeqCol].toString()
                  : ''
              )}
            </MenuItem>
          )}
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
      <MediaPlayer auth={auth} srcMediaId={srcMediaId} onEnded={playEnded} />
    </div>
  );
}

export default PlanSheet;
