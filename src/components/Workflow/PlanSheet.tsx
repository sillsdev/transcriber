import { useState, useEffect, useRef, useContext, memo, useMemo } from 'react';
import { useGlobal } from 'reactn';
import {
  IPlanSheetStrings,
  ISharedStrings,
  BookNameMap,
  OptionType,
  IWorkflow,
  OrgWorkflowStep,
  IViewModeStrings,
  WorkflowLevel,
} from '../../model';
import { Badge, Box, styled } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { useSnackBar } from '../../hoc/SnackBar';
import DataSheet from 'react-datasheet';
import Confirm from '../AlertDialog';
import BookSelect from '../BookSelect';
import {
  AddSectionPassageButtons,
  ProjButtons,
  StageReport,
  TabActions,
  ActionHeight,
  GrowingSpacer,
  AltButton,
  PriButton,
  iconMargin,
} from '../../control';
import 'react-datasheet/lib/react-datasheet.css';
import {
  refMatch,
  cleanClipboard,
  localUserKey,
  LocalKey,
  rememberCurrentPassage,
} from '../../utils';
import { isPassageRow, isSectionRow } from '.';
import { remoteIdGuid, useOrganizedBy, useRole } from '../../crud';
import TaskAvatar from '../TaskAvatar';
import MediaPlayer from '../MediaPlayer';
import { PlanContext } from '../../context/PlanContext';
import PlanActionMenu from './PlanActionMenu';
import { TabAppBar } from '../../control';
import PlanAudioActions from './PlanAudioActions';
import { HotKeyContext } from '../../context/HotKeyContext';
import { UnsavedContext } from '../../context/UnsavedContext';
import FilterMenu, { ISTFilterState } from './filterMenu';
import {
  planSheetSelector,
  sharedSelector,
  viewModeSelector,
} from '../../selector';
import { useSelector, shallowEqual } from 'react-redux';
import { PassageTypeEnum } from '../../model/passageType';
import {
  RefRender,
  passageTypeFromRef,
  isPublishingTitle,
} from '../../control/RefRender';
import React from 'react';

const MemoizedTaskAvatar = memo(TaskAvatar);

const DOWN_ARROW = 'ARROWDOWN';

const ContentDiv = styled('div')(({ theme }) => ({
  paddingTop: `calc(${ActionHeight}px + ${theme.spacing(2)})`,
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
  '& .data-grid-container .data-grid .cell.refErr': {
    backgroundColor: theme.palette.warning.main,
    textAlign: 'left',
  },
  '& .data-grid-container .data-grid .cell.pass > input': {
    backgroundColor: theme.palette.background.paper,
    textAlign: 'left',
    padding: theme.spacing(1),
  },
  '& .data-grid-container .data-grid .cell.bk': {
    backgroundColor: '#f1cdcd',
  },
  '& .data-grid-container .data-grid .cell.movement': {
    backgroundColor: '#cdeaf1',
  },
  '& tr td:first-of-type > span': {
    display: 'flex!important',
    justifyContent: 'center',
  },
  '& tr td:nth-of-type(2) > span': {
    display: 'flex!important',
    justifyContent: 'center',
  },
}));

const WarningDiv = styled('div')(({ theme }) => ({
  backgroundColor: theme.palette.warning.main,
  display: 'flex',
  justifyContent: 'space-around',
  padding: theme.spacing(1),
  marginBottom: theme.spacing(1),
}));

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

interface IProps {
  toolId: string;
  columns: Array<ICell>;
  rowData: Array<Array<string | number>>;
  rowInfo: Array<IWorkflow>;
  bookCol: number;
  bookSuggestions?: OptionType[];
  bookMap?: BookNameMap;
  filterState: ISTFilterState;
  maximumSection: number;
  orgSteps: OrgWorkflowStep[];
  canSetDefault: boolean;
  updateData: (changes: ICellChange[]) => void;
  paste: (rows: string[][]) => string[][];
  action: (what: string, where: number[]) => Promise<boolean>;
  addPassage: (ptype?: PassageTypeEnum, i?: number, before?: boolean) => void;
  movePassage: (i: number, before: boolean, section: boolean) => void;
  addSection: (
    level: WorkflowLevel,
    i?: number,
    ptype?: PassageTypeEnum
  ) => void;
  onPublishing: () => void;
  lookupBook: (book: string) => string;
  resequence: () => void;
  inlinePassages: boolean;
  onAudacity?: (i: number) => void;
  onPassageDetail: (i: number) => void;
  onAssign: (where: number[]) => () => void;
  onUpload: (i: number) => () => void;
  onRecord: (i: number) => void;
  onHistory: (i: number) => () => void;
  onFilterChange: (
    newstate: ISTFilterState | undefined,
    isDefault: boolean
  ) => void;
}

export function PlanSheet(props: IProps) {
  const {
    toolId,
    columns,
    rowData,
    rowInfo,
    bookCol,
    bookSuggestions,
    bookMap,
    filterState,
    maximumSection,
    orgSteps,
    canSetDefault,
    updateData,
    action,
    addPassage,
    movePassage,
    addSection,
    paste,
    resequence,
    inlinePassages,
    onAudacity,
    onPassageDetail,
    onFilterChange,
    onPublishing,
  } = props;
  const ctx = useContext(PlanContext);
  const { projButtonStr, connected, readonly } = ctx.state;

  const [memory] = useGlobal('memory');
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
  const saveTimer = useRef<NodeJS.Timeout>();
  const [offlineOnly] = useGlobal('offlineOnly');
  const [pasting, setPasting] = useState(false);
  const preventSave = useRef<boolean>(false);
  const currentRowRef = useRef<number>(-1);
  const [currentRow, setCurrentRowx] = useState(-1);
  const [active, setActive] = useState(-1); // used for action menu to display
  const sheetRef = useRef<any>();
  const {
    startSave,
    toolsChanged,
    saveRequested,
    isChanged,
    clearRequested,
    clearCompleted,
  } = useContext(UnsavedContext).state;
  const [srcMediaId, setSrcMediaId] = useState('');
  const [mediaPlaying, setMediaPlaying] = useState(false);
  const [warning, setWarning] = useState<string>();
  const [toRow, setToRow] = useState(0);
  const t: IPlanSheetStrings = useSelector(planSheetSelector, shallowEqual);
  const ts: ISharedStrings = useSelector(sharedSelector, shallowEqual);
  const tv: IViewModeStrings = useSelector(viewModeSelector, shallowEqual);
  const { subscribe, unsubscribe } = useContext(HotKeyContext).state;
  const SectionSeqCol = 0;
  const PassageSeqCol = 2;
  const LastCol = bookCol > 0 ? 6 : 5;

  const isSection = (i: number) =>
    i >= 0 && i < rowInfo.length ? isSectionRow(rowInfo[i]) : false;
  const isPassage = (i: number) =>
    i >= 0 && i < rowInfo.length ? isPassageRow(rowInfo[i]) : false;
  const isTitle = (i: number) =>
    i >= 0 && i < rowInfo.length
      ? rowInfo[i].passageType === PassageTypeEnum.TITLE
      : false;
  const firstVernacularInSection = (i: number) => {
    if (rowInfo[i].passageType !== PassageTypeEnum.PASSAGE) return false;
    while (--i >= 0 && !isSection(i)) {
      if (rowInfo[i].passageType === PassageTypeEnum.PASSAGE) return false;
    }
    return true;
  };
  const isBook = (i: number) =>
    i >= 0 &&
    i < rowInfo.length &&
    (rowInfo[i].level === WorkflowLevel.Book ||
      rowInfo[i].passageType === PassageTypeEnum.BOOK ||
      rowInfo[i].passageType === PassageTypeEnum.ALTBOOK);

  const isMovement = (i: number) =>
    i >= 0 && i < rowInfo.length && rowInfo[i].level === WorkflowLevel.Movement;

  const isInMovement = (i: number) => {
    if (
      i >= 0 &&
      i < rowInfo.length &&
      (rowInfo[i].passageType === PassageTypeEnum.NOTE ||
        rowInfo[i].passageType === PassageTypeEnum.TITLE)
    ) {
      var sec = i - 1;
      while (sec > 0 && !isSection(sec)) sec--;
      return isMovement(sec);
    }
    return false;
  };

  const [changed, setChanged] = useState(false); //for button enabling
  const changedRef = useRef(false); //for autosave
  const [saving, setSaving] = useState(false);
  const { userIsAdmin } = useRole();
  const { getOrganizedBy } = useOrganizedBy();
  const [organizedBy] = useState(getOrganizedBy(true));
  const moveUp = true;
  const moveDown = false;
  const moveSection = true;

  const handleSave = () => {
    startSave();
  };

  const onMovementAbove = () => {
    //we'll find a section before we get past 0
    var row = currentRow - 1;
    while (!isSection(row)) row -= 1;
    addSection(WorkflowLevel.Movement, row, PassageTypeEnum.MOVEMENT);
  };
  const onSectionAbove = () => {
    //we'll find a section before we get past 0
    var row = currentRow - 1;
    while (!isSection(row)) row -= 1;
    addSection(WorkflowLevel.Section, row);
  };

  const onNote = () => {
    if (inlinePassages)
      addSection(WorkflowLevel.Section, currentRow, PassageTypeEnum.NOTE);
    else addPassage(PassageTypeEnum.NOTE, currentRow - 1, true);
  };
  const onPassageBelow = () => {
    addPassage(undefined, currentRow - 1, false);
  };
  const onPassageLast = () => {
    //we're on a section so find our last row and add it below it
    var row = currentRow;
    while (isPassage(row + 1)) row++;
    addPassage(undefined, row, false);
  };

  const onPassageToPrev = () => {
    //convert from currentRow with includes header
    movePassage(currentRow - 1, moveUp, moveSection);
  };

  const onPassageToNext = () => {
    //convert from currentRow with includes header
    movePassage(currentRow - 1, moveDown, moveSection);
  };
  const onPassageUp = () => {
    //convert from currentRow with includes header
    movePassage(currentRow - 1, moveUp, !moveSection);
  };
  const onPassageDown = () => {
    //convert from currentRow with includes header
    movePassage(currentRow - 1, moveDown, !moveSection);
  };

  const onSectionEnd = () => {
    addSection(WorkflowLevel.Section);
  };

  const onPassageEnd = () => {
    addPassage();
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
    if (isPassage(row - 1)) {
      rememberCurrentPassage(memory, rowInfo[row - 1].passage?.id ?? '');
    }
  };

  const handleSelect = (loc: DataSheet.Selection) => {
    setCurrentRow(loc.end.i);
    sheetScroll();
  };

  const handleValueRender = (cell: ICell) => {
    return cell.className?.substring(0, 4) === 'book' && bookMap
      ? bookMap[cell.value]
      : cell.className?.includes('num')
      ? cell.value < 0 || Math.floor(cell.value) !== cell.value
        ? ''
        : cell.value
      : cell.value;
  };
  const handleDataRender = (cell: ICell) => cell.value;

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
    if (i > 0 && !readonly) {
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
    useEffect(() => {
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
    let timeoutRef: NodeJS.Timeout | undefined = undefined;
    if (rowInfo) {
      const lastPasId = localStorage.getItem(localUserKey(LocalKey.passage));
      let row = -1;
      if (lastPasId) {
        const pasGuid = remoteIdGuid('passage', lastPasId, memory.keyMap);
        row = rowInfo.findIndex((r) => r.passage?.id === pasGuid);
      }
      if (row >= 0) {
        let tbodyRef: HTMLDivElement | undefined = undefined;
        if (sheetRef.current) {
          const gridRef = (
            sheetRef.current as HTMLDivElement
          ).getElementsByClassName('data-grid-container');
          tbodyRef = gridRef[0]?.firstChild?.firstChild?.childNodes[
            row + 1
          ] as HTMLDivElement;
        }
        if (tbodyRef) {
          setCurrentRow(row + 1);
          sheetScroll();
          // The useEffect will trigger when sheet is present but
          // if sheet is present and we aren't ready, set a half
          // second timeout and check again
        } else if (sheetRef.current) {
          timeoutRef = setTimeout(() => {
            setToRow(toRow + 1);
          }, 500);
        }
      }
    }

    return () => {
      if (timeoutRef) clearTimeout(timeoutRef);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowInfo, toRow]);

  useEffect(() => {
    changedRef.current = isChanged(toolId);
    if (changedRef.current !== changed) setChanged(changedRef.current);
    var isSaving = saveRequested(toolId);
    if (isSaving !== saving) setSaving(isSaving);
    if (clearRequested(toolId)) {
      changedRef.current = false;
      clearCompleted(toolId);
    }
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

  const refErrTest = (ref: any) =>
    typeof ref !== 'string' ||
    (!refMatch(ref) &&
      passageTypeFromRef(ref, inlinePassages) === PassageTypeEnum.PASSAGE);

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
            width: userIsAdmin ? 50 : 20,
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
          const movement = isMovement(rowIndex);
          const book = isBook(rowIndex);
          const title = isTitle(rowIndex);
          const iscurrent: string =
            currentRow === rowIndex + 1 ? ' currentrow ' : '';

          const calcClassName =
            iscurrent + section
              ? 'set' +
                (passage ? 'p' : '') +
                (movement ? ' movement' : book ? ' bk' : '')
              : 'pass';

          return [
            {
              value: passage &&
                !isPublishingTitle(row[refCol].toString(), inlinePassages) && (
                  <Badge
                    badgeContent={rowInfo[rowIndex].discussionCount}
                    color="secondary"
                  >
                    <StageReport
                      onClick={handlePassageDetail(rowIndex)}
                      step={rowInfo[rowIndex].step || ''}
                      tip={tv.gotowork}
                    />
                  </Badge>
                ),
              readOnly: true,
              className: calcClassName,
            } as ICell,
            {
              value: (
                <MemoizedTaskAvatar
                  assigned={rowInfo[rowIndex].transcriber?.id || ''}
                />
              ),
              readOnly: true,
              className: calcClassName,
            } as ICell,
          ]
            .concat(
              passage
                ? [
                    {
                      value: (
                        <PlanAudioActions
                          rowIndex={rowIndex}
                          isPassage={passage}
                          mediaId={rowInfo[rowIndex].mediaId?.id || ''}
                          mediaShared={rowInfo[rowIndex].mediaShared}
                          onPlayStatus={handlePlayStatus}
                          onHistory={props.onHistory}
                          isPlaying={
                            srcMediaId === rowInfo[rowIndex].mediaId?.id &&
                            mediaPlaying
                          }
                        />
                      ),
                      readOnly: true,
                      className: calcClassName,
                    } as ICell,
                  ]
                : [
                    {
                      value: <></>,
                      readOnly: true,
                      className: calcClassName,
                    } as ICell,
                  ]
            )
            .concat(
              row.slice(0, LastCol).map((e, cellIndex) => {
                return cellIndex === bookCol && passage
                  ? {
                      value: e,
                      readOnly: readonly,
                      className: 'book ' + calcClassName,
                      dataEditor: bookEditor,
                    }
                  : cellIndex === refCol
                  ? {
                      value:
                        passageTypeFromRef(e as string, inlinePassages) !==
                        PassageTypeEnum.PASSAGE ? (
                          <RefRender
                            value={e as string}
                            flat={inlinePassages}
                          />
                        ) : (
                          e
                        ),
                      readOnly:
                        readonly ||
                        passageTypeFromRef(e as string, inlinePassages) !==
                          PassageTypeEnum.PASSAGE,
                      className:
                        calcClassName + ' ref' + (refErrTest(e) ? 'Err' : ''),
                    }
                  : {
                      value: e,
                      readOnly:
                        readonly ||
                        (cellIndex === SectionSeqCol && (e as number) < 0) ||
                        cellIndex === PassageSeqCol ||
                        section
                          ? passage
                            ? false
                            : cellIndex > 1
                          : cellIndex <= 1,
                      className:
                        (cellIndex === SectionSeqCol ||
                        cellIndex === PassageSeqCol
                          ? 'num '
                          : '') + calcClassName,
                    };
              })
            )
            .concat([
              {
                value: (
                  <PlanActionMenu
                    rowIndex={rowIndex}
                    isSection={section}
                    isPassage={passage}
                    psgType={rowInfo[rowIndex].passageType}
                    organizedBy={organizedBy}
                    sectionSequenceNumber={row[SectionSeqCol].toString()}
                    passageSequenceNumber={row[PassageSeqCol].toString()}
                    readonly={readonly || check.length > 0}
                    onDelete={handleConfirmDelete}
                    onPlayStatus={handlePlayStatus}
                    onAudacity={handleAudacity}
                    onRecord={props.onRecord}
                    onUpload={props.onUpload}
                    onAssign={props.onAssign}
                    canAssign={userIsAdmin && !movement && !book}
                    canDelete={userIsAdmin}
                    active={active - 1 === rowIndex}
                    onDisableFilter={
                      !readonly && filtered ? disableFilter : undefined
                    }
                    onNote={
                      !readonly &&
                      !filtered &&
                      !inlinePassages &&
                      !isTitle(rowIndex + 1)
                        ? onNote
                        : undefined
                    }
                    onPassageBelow={
                      !readonly &&
                      !filtered &&
                      !inlinePassages &&
                      !movement &&
                      !isInMovement(rowIndex) &&
                      !book &&
                      !isTitle(rowIndex + 1)
                        ? onPassageBelow
                        : undefined
                    }
                    onMovementAbove={
                      !readonly &&
                      !filtered &&
                      !inlinePassages &&
                      rowInfo.length > 0 &&
                      section &&
                      !book
                        ? onMovementAbove
                        : undefined
                    }
                    onSectionAbove={
                      !readonly &&
                      !filtered &&
                      rowInfo.length > 0 &&
                      section &&
                      !book
                        ? onSectionAbove
                        : undefined
                    }
                    onPassageDown={
                      !readonly &&
                      !filtered &&
                      passage &&
                      !title &&
                      !book &&
                      !isSection(rowIndex + 1) &&
                      rowIndex < rowInfo.length - 1
                        ? onPassageDown
                        : undefined
                    }
                    onPassageToNext={
                      !readonly &&
                      !filtered &&
                      !inlinePassages &&
                      passage &&
                      !title &&
                      !book &&
                      isSection(rowIndex + 1)
                        ? onPassageToNext
                        : undefined
                    }
                    onPassageUp={
                      !readonly &&
                      !filtered &&
                      rowIndex > 1 &&
                      passage &&
                      !isTitle(rowIndex - 1) &&
                      !title &&
                      !book &&
                      !isSection(rowIndex - 1)
                        ? onPassageUp
                        : undefined
                    }
                    onPassageToPrev={
                      !readonly &&
                      !filtered &&
                      !inlinePassages &&
                      rowIndex > 1 &&
                      passage &&
                      !title &&
                      !book &&
                      firstVernacularInSection(rowIndex)
                        ? onPassageToPrev
                        : undefined
                    }
                  />
                ),
                // readOnly: true,
                className: calcClassName,
                dataEditor: ActivateCell,
              } as ICell,
            ]);
        })
      );
      let refErr = false;
      if (refCol > 0) {
        rowData.forEach((row, rowIndex) => {
          if (isPassage(rowIndex)) {
            if (refErrTest(row[refCol])) refErr = true;
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
  const currentRowSectionNum = useMemo(() => {
    if (currentRowRef.current < 1) return '';
    var row = currentRowRef.current - 1;
    while (row >= 0 && !isSection(row)) row--;
    return row >= 0 ? rowData[row][SectionSeqCol].toString() : '';
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRow, rowData, rowInfo]);

  const currentRowPassageNum = useMemo(() => {
    return currentRowRef.current > 0 && isPassage(currentRowRef.current - 1)
      ? rowData[currentRowRef.current - 1][PassageSeqCol].toString()
      : '';
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRow, rowData, rowInfo]);

  const filtered = useMemo(() => {
    // console.log('filtered useMemo', filterState);
    return (
      !filterState.disabled &&
      (filterState.minStep !== '' ||
        filterState.maxStep !== '' ||
        filterState.hideDone ||
        filterState.minSection > 1 ||
        (filterState.maxSection > -1 &&
          filterState.maxSection < maximumSection) ||
        filterState.assignedToMe ||
        filterState.hidePublishing)
    );
  }, [filterState, maximumSection]);

  const dataRowisSection = useMemo(() => {
    return isSection(currentRow - 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRow]);

  const dataRowisBook = useMemo(() => {
    return isBook(currentRow - 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRow]);

  const disableFilter = () => {
    onFilterChange({ ...filterState, disabled: true }, false);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <div>
        <TabAppBar position="fixed" color="default">
          <TabActions>
            {userIsAdmin && (
              <>
                <AddSectionPassageButtons
                  inlinePassages={inlinePassages}
                  numRows={rowInfo.length}
                  readonly={readonly}
                  isSection={dataRowisSection}
                  isPassage={isPassage(currentRow - 1)}
                  mouseposition={position}
                  handleNoContextMenu={handleNoContextMenu}
                  sectionSequenceNumber={currentRowSectionNum}
                  passageSequenceNumber={currentRowPassageNum}
                  onNote={
                    !readonly && !filtered && !isTitle(currentRow)
                      ? onNote
                      : undefined
                  }
                  onPassageBelow={
                    !readonly &&
                    !filtered &&
                    !inlinePassages &&
                    !isMovement(currentRow - 1) &&
                    !isInMovement(currentRow - 1) &&
                    !dataRowisBook &&
                    !isTitle(currentRow)
                      ? onPassageBelow
                      : undefined
                  }
                  onPassageEnd={
                    !filtered && currentRow !== rowInfo.length
                      ? onPassageEnd
                      : undefined
                  }
                  onPassageLast={
                    !filtered && dataRowisSection ? onPassageLast : undefined
                  }
                  onMovementAbove={
                    !readonly &&
                    !filtered &&
                    !inlinePassages &&
                    !dataRowisBook &&
                    rowInfo.length > 0 &&
                    currentRow > 0 &&
                    dataRowisSection
                      ? onMovementAbove
                      : undefined
                  }
                  onSectionAbove={
                    !filtered &&
                    !dataRowisBook &&
                    currentRow > 0 &&
                    rowInfo.length > 0
                      ? onSectionAbove
                      : undefined
                  }
                  onSectionEnd={!filtered ? onSectionEnd : undefined}
                  onDisableFilter={filtered ? disableFilter : undefined}
                  onPublishing={
                    !readonly && !filtered && !inlinePassages
                      ? onPublishing
                      : undefined
                  }
                />
                <AltButton
                  id="planSheetImp"
                  key="importExcel"
                  aria-label={t.tablePaste}
                  disabled={pasting || readonly || filtered}
                  onClick={handleTablePaste}
                >
                  {t.tablePaste}
                </AltButton>
                <AltButton
                  id="planSheetReseq"
                  key="resequence"
                  aria-label={t.resequence}
                  disabled={pasting || data.length < 2 || readonly || filtered}
                  onClick={handleResequence}
                >
                  {t.resequence}
                </AltButton>
                <ProjButtons
                  {...props}
                  noImExport={pasting}
                  noIntegrate={pasting || data.length < 2}
                  t={projButtonStr}
                />
              </>
            )}

            <GrowingSpacer />
            <FilterMenu
              canSetDefault={canSetDefault}
              state={filterState}
              onFilterChange={onFilterChange}
              orgSteps={orgSteps}
              maximumSection={maximumSection}
              filtered={filtered}
            />
            {userIsAdmin && (
              <>
                <PriButton
                  id="planSheetSave"
                  key="save"
                  aria-label={t.save}
                  color={connected ? 'primary' : 'secondary'}
                  onClick={handleSave}
                  disabled={saving || !changed}
                >
                  {t.save}
                  <SaveIcon sx={iconMargin} className="small-icon" />
                </PriButton>
              </>
            )}
          </TabActions>
        </TabAppBar>
        <ContentDiv id="PlanSheet" ref={sheetRef}>
          {warning && <WarningDiv>{warning}</WarningDiv>}
          <DataSheet
            data={data as any[][]}
            valueRenderer={handleValueRender}
            dataRenderer={handleDataRender}
            onContextMenu={handleContextMenu}
            onCellsChanged={handleCellsChanged}
            parsePaste={parsePaste}
            onSelect={handleSelect}
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
          <MediaPlayer
            srcMediaId={srcMediaId}
            onEnded={playEnded}
            requestPlay={mediaPlaying}
          />
        </ContentDiv>
      </div>
    </Box>
  );
}

export default PlanSheet;
