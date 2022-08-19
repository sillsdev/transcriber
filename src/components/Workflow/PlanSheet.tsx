import React, { useState, useEffect, useRef, useContext } from 'react';
import { useGlobal } from 'reactn';
import {
  IPlanSheetStrings,
  ISharedStrings,
  BookNameMap,
  OptionType,
  IWorkflow,
  RoleNames,
} from '../../model';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import { Button, AppBar, Badge } from '@material-ui/core';
import SaveIcon from '@mui/icons-material/Save';
import { useSnackBar } from '../../hoc/SnackBar';
import DataSheet from 'react-datasheet';
import Confirm from '../AlertDialog';
import BookSelect from '../BookSelect';
import {
  AddSectionPassageButtons,
  ProjButtons,
  StageReport,
} from '../../control';
import 'react-datasheet/lib/react-datasheet.css';
import { refMatch, cleanClipboard } from '../../utils';
import { isPassageRow, isSectionRow } from '.';
import { useDiscussionCount } from '../../crud';
import TaskAvatar from '../TaskAvatar';
import MediaPlayer from '../MediaPlayer';
import { PlanContext } from '../../context/PlanContext';
import PlanActionMenu from './PlanActionMenu';
import { ActionHeight, tabActions, actionBar } from '../PlanTabs';
import PlanAudioActions from './PlanAudioActions';
import { HotKeyContext } from '../../context/HotKeyContext';
import { UnsavedContext } from '../../context/UnsavedContext';

const MemoizedTaskAvatar = React.memo(TaskAvatar);

const DOWN_ARROW = 'ARROWDOWN';

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
      '& .data-grid-container .data-grid .cell.currentrow': {
        borderStyle: 'double',
        borderColor: theme.palette.primary.light,
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
    actions: tabActions,
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

export interface ICellChange {
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
  toolId: string;
  columns: Array<ICell>;
  rowData: Array<Array<string | number>>;
  rowInfo: Array<IWorkflow>;
  bookCol: number;
  bookSuggestions?: OptionType[];
  bookMap?: BookNameMap;
  updateData: (changes: ICellChange[]) => void;
  paste: (rows: string[][]) => string[][];
  action: (what: string, where: number[]) => Promise<boolean>;
  addPassage: (i?: number, before?: boolean) => void;
  movePassage: (i: number, before: boolean) => void;
  addSection: (i?: number) => void;
  lookupBook: (book: string) => string;
  resequence: () => void;
  inlinePassages: boolean;
  onTranscribe: (i: number) => void;
  onAudacity?: (i: number) => void;
  onPassageDetail: (i: number) => void;
  onAssign: (where: number[]) => () => void;
  onUpload: (i: number) => () => void;
  onRecord: (i: number) => void;
  onHistory: (i: number) => () => void;
}

export function PlanSheet(props: IProps) {
  const {
    toolId,
    columns,
    rowData,
    rowInfo,
    t,
    ts,
    bookCol,
    bookSuggestions,
    bookMap,
    updateData,
    action,
    addPassage,
    movePassage,
    addSection,
    paste,
    resequence,
    inlinePassages,
    onTranscribe,
    onAudacity,
    onPassageDetail,
  } = props;
  const classes = useStyles();
  const ctx = React.useContext(PlanContext);
  const {
    projButtonStr,
    mediafiles,
    discussions,
    groupmemberships,
    connected,
    readonly,
  } = ctx.state;
  const getDiscussionCount = useDiscussionCount({
    mediafiles,
    discussions,
    groupmemberships,
  });
  const [isOffline] = useGlobal('offline');
  const [projRole] = useGlobal('projRole');
  const [global] = useGlobal();
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
  const [offlineOnly] = useGlobal('offlineOnly');
  const [pasting, setPasting] = useState(false);
  const preventSave = useRef<boolean>(false);
  const currentRowRef = useRef<number>(-1);
  const [currentRow, setCurrentRowx] = useState(-1);
  const [active, setActive] = useState(-1); // used for action menu to display
  const sheetRef = useRef<any>();
  const { startSave, toolsChanged, saveRequested, isChanged } =
    useContext(UnsavedContext).state;
  const [srcMediaId, setSrcMediaId] = useState('');
  const [mediaPlaying, setMediaPlaying] = useState(false);
  const [warning, setWarning] = useState<string>();

  const { subscribe, unsubscribe } = useContext(HotKeyContext).state;
  const SectionSeqCol = 0;
  const PassageSeqCol = 2;
  const LastCol = bookCol > 0 ? 6 : 5;
  const isSection = (i: number) =>
    i >= 0 && i < rowInfo.length ? isSectionRow(rowInfo[i]) : false;

  const isPassage = (i: number) =>
    i >= 0 && i < rowInfo.length ? isPassageRow(rowInfo[i]) : false;

  const [changed, setChanged] = useState(false); //for button enabling
  const changedRef = useRef(false); //for autosave
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    startSave();
  };

  const sheetScroll = () => {
    if (sheetRef.current && currentRowRef.current) {
      const gridRef = (
        sheetRef.current as HTMLDivElement
      ).getElementsByClassName('data-grid-container');
      const tbodyRef = gridRef[0]?.firstChild?.firstChild?.childNodes[
        currentRowRef.current
      ] as HTMLDivElement;
      //only scroll if it's not already visible
      if (tbodyRef && tbodyRef.offsetTop < document.documentElement.scrollTop) {
        window.scrollTo(0, tbodyRef.offsetTop - 10);
      } else if (
        tbodyRef &&
        tbodyRef.offsetTop >
          document.documentElement.scrollTop +
            document.documentElement.clientHeight -
            ActionHeight -
            200
      ) {
        window.scrollTo(0, tbodyRef.offsetTop + 10);
      }
    }
    return false;
  };
  const setCurrentRow = (row: number) => {
    currentRowRef.current = row;
    setCurrentRowx(row);
  };
  const handleSelect = (loc: DataSheet.Selection) => {
    setCurrentRow(loc.end.i);
    sheetScroll();
  };

  const handleValueRender = (cell: ICell) =>
    cell.className?.substring(0, 4) === 'book' && bookMap
      ? bookMap[cell.value]
      : cell.value;

  const handleConfirmDelete = (rowIndex: number) => () => {
    const toDelete = [rowIndex];
    if (isSection(rowIndex)) {
      var psg = rowIndex + 1;
      while (psg < rowData.length && !isSection(psg)) {
        toDelete.push(psg);
        psg++;
      }
    }
    setCheck(toDelete);
    setConfirmAction('Delete');
  };

  const handleActionConfirmed = () => {
    if (action != null) {
      action(confirmAction, check).then((result) => {
        setCheck(Array<number>());
      });
    }
    setConfirmAction('');
  };

  const handleActionRefused = () => {
    setConfirmAction('');
    setCheck(Array<number>());
  };

  const handlePlayStatus = (mediaId: string) => {
    if (mediaId === srcMediaId) {
      setMediaPlaying(!mediaPlaying);
    } else {
      setSrcMediaId(mediaId);
    }
  };

  const handleTranscribe = (i: number) => {
    setSrcMediaId('');
    onTranscribe(i);
  };

  const handleAudacity = (i: number) => () => {
    onAudacity && onAudacity(i);
  };

  const handlePassageDetail = (i: number) => () => {
    onPassageDetail && onPassageDetail(i);
  };

  const handleCellsChanged = (changes: Array<ICellChange>) => {
    if (readonly) return; //readonly
    const colChanges = changes.map((c) => ({
      ...c,
      row: c.row - 1,
      col: c.col - 3,
    }));
    updateData(colChanges);
  };

  const handleContextMenu = (
    e: MouseEvent,
    cell: any,
    i: number,
    j: number
  ) => {
    e.preventDefault();
    if (i > 0 && (!isOffline || offlineOnly) && projRole === RoleNames.Admin) {
      setPosition({ mouseX: e.clientX - 2, mouseY: e.clientY - 4, i, j });
    }
  };

  const handleNoContextMenu = () => setPosition(initialPosition);

  const parsePaste = (clipBoard: string) => {
    if (readonly) return Array<Array<string>>();
    if (currentRowRef.current === 0) {
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

  const ActivateCell = (props: any) => {
    React.useEffect(() => {
      setActive(currentRowRef.current);
      props.onRevert();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props]);
    return <></>;
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

  const handleAutoSave = () => {
    if (changedRef.current && !preventSave.current && !global.alertOpen) {
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
    const keys = [{ key: DOWN_ARROW, cb: sheetScroll }];
    keys.forEach((k) => subscribe(k.key, k.cb));

    return () => {
      keys.forEach((k) => unsubscribe(k.key));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    changedRef.current = isChanged(toolId);
    if (changedRef.current !== changed) setChanged(changedRef.current);
    var isSaving = saveRequested(toolId);
    if (isSaving !== saving) setSaving(isSaving);
    if (changedRef.current) {
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
  }, [toolsChanged]);

  const refErrTest = (ref: any) => typeof ref !== 'string' || !refMatch(ref);

  useEffect(() => {
    if (rowData.length !== rowInfo.length) {
      setData([]);
    } else {
      const refCol = bookCol + 1;

      let data = [
        [
          {
            value: t.step,
            readOnly: true,
          } as ICell,
          {
            value: t.assigned,
            readOnly: true,
          } as ICell,
          {
            value: t.action,
            readOnly: true,
            width: projRole === RoleNames.Admin ? 50 : 20,
          } as ICell,
        ].concat(
          columns.map((col) => {
            return { ...col, readOnly: true };
          })
        ),
      ].concat(
        rowData.map((row, rowIndex) => {
          const section = isSection(rowIndex);
          const passage = isPassage(rowIndex);
          const iscurrent = currentRow === rowIndex + 1 ? ' currentrow ' : '';

          return [
            {
              value: passage && (
                <Badge
                  badgeContent={getDiscussionCount(
                    rowInfo[rowIndex].passageId?.id || '',
                    rowInfo[rowIndex]?.stepId || ''
                  )}
                  color="secondary"
                >
                  <StageReport
                    onClick={handlePassageDetail(rowIndex)}
                    step={rowInfo[rowIndex].step || ''}
                  />
                </Badge>
              ),
              readOnly: true,
              className:
                iscurrent + (section ? 'set' + (passage ? 'p' : '') : 'pass'),
            } as ICell,
            {
              value: (
                <MemoizedTaskAvatar
                  assigned={rowInfo[rowIndex].transcriber?.id || ''}
                />
              ),
              readOnly: true,
              className:
                iscurrent + (section ? 'set' + (passage ? 'p' : '') : 'pass'),
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
                          mediaId={rowInfo[rowIndex].mediaId?.id}
                          mediaShared={rowInfo[rowIndex].mediaShared}
                          onPlayStatus={handlePlayStatus}
                          onPassageDetail={handlePassageDetail}
                          onTranscribe={handleTranscribe}
                          online={connected || offlineOnly}
                          readonly={readonly}
                          isPlaying={
                            srcMediaId === rowInfo[rowIndex].mediaId?.id &&
                            mediaPlaying
                          }
                        />
                      ),
                      readOnly: true,
                      className:
                        iscurrent +
                        (section ? 'set' + (passage ? 'p' : ' ') : 'pass'),
                    } as ICell,
                  ]
                : [
                    {
                      value: <></>,
                      readOnly: true,
                      className: iscurrent + 'set',
                    } as ICell,
                  ]
            )
            .concat(
              row.slice(0, LastCol).map((e, cellIndex) => {
                return cellIndex === bookCol && passage
                  ? {
                      value: e,
                      readOnly: isOffline && !offlineOnly,
                      className:
                        iscurrent + 'book ' + (section ? ' setp' : 'pass'),
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
                        iscurrent +
                        (cellIndex === SectionSeqCol ||
                        cellIndex === PassageSeqCol
                          ? 'num '
                          : '') +
                        (section ? 'set' + (passage ? 'p' : '') : 'xxpass') +
                        (refCol && refCol === cellIndex && refErrTest(e)
                          ? 'Err'
                          : ''),
                    };
              })
            )
            .concat([
              {
                value: (
                  <PlanActionMenu
                    {...props}
                    rowIndex={rowIndex}
                    isSection={section}
                    isPassage={passage}
                    readonly={readonly || check.length > 0}
                    online={connected || offlineOnly}
                    mediaId={rowInfo[rowIndex].mediaId?.id}
                    mediaShared={rowInfo[rowIndex].mediaShared}
                    onDelete={handleConfirmDelete}
                    onPlayStatus={handlePlayStatus}
                    onAudacity={handleAudacity}
                    canAssign={projRole === RoleNames.Admin}
                    canDelete={projRole === RoleNames.Admin}
                    active={active - 1 === rowIndex}
                  />
                ),
                // readOnly: true,
                className:
                  iscurrent +
                  (section ? 'set' + (passage ? 'p' : ' ') : 'pass'),
                dataEditor: ActivateCell,
              } as ICell,
            ]);
        })
      );

      let refErr = false;
      if (refCol > 0) {
        rowData.forEach((row, rowIndex) => {
          if (isPassage(rowIndex)) {
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
  }, [
    rowData,
    rowInfo,
    bookCol,
    columns,
    srcMediaId,
    mediaPlaying,
    projRole,
    currentRow,
    check,
  ]);

  useEffect(() => {
    //if I set playing when I set the mediaId, it plays a bit of the old
    if (srcMediaId) setMediaPlaying(true);
  }, [srcMediaId]);

  useEffect(() => {
    suggestionRef.current = bookSuggestions;
  }, [bookSuggestions]);

  const playEnded = () => {
    setMediaPlaying(false);
  };
  const currentRowSectionNum = () => {
    if (currentRowRef.current < 1) return '';
    var row = currentRowRef.current - 1;
    while (row >= 0 && !isSection(row)) row--;
    return row >= 0 ? rowData[row][SectionSeqCol].toString() : '';
  };

  const currentRowPassageNum = () =>
    currentRowRef.current > 0 && isPassage(currentRowRef.current - 1)
      ? rowData[currentRowRef.current - 1][PassageSeqCol].toString()
      : '';

  return (
    <div className={classes.container}>
      <div className={classes.paper}>
        {projRole === RoleNames.Admin && (
          <AppBar position="fixed" className={classes.bar} color="default">
            <div className={classes.actions}>
              <>
                <AddSectionPassageButtons
                  inlinePassages={inlinePassages}
                  numRows={rowInfo.length}
                  readonly={readonly}
                  t={t}
                  isSection={isSection}
                  isPassage={isPassage}
                  currentrow={currentRow - 1}
                  mouseposition={position}
                  handleNoContextMenu={handleNoContextMenu}
                  sectionSequenceNumber={currentRowSectionNum()}
                  passageSequenceNumber={currentRowPassageNum()}
                  addSection={addSection}
                  addPassage={addPassage}
                  movePassage={movePassage}
                />
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
                <Button
                  id="planSheetSave"
                  key="save"
                  aria-label={t.save}
                  variant="contained"
                  color={connected ? 'primary' : 'secondary'}
                  className={classes.button}
                  onClick={handleSave}
                  disabled={saving || !changed}
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
      <MediaPlayer
        srcMediaId={srcMediaId}
        onEnded={playEnded}
        requestPlay={mediaPlaying}
      />
    </div>
  );
}

export default PlanSheet;
