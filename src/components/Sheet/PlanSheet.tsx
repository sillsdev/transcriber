import {
  useState,
  useEffect,
  useRef,
  useContext,
  useMemo,
  MouseEventHandler,
} from 'react';
import { useGlobal } from 'reactn';
import {
  IPlanSheetStrings,
  ISharedStrings,
  BookNameMap,
  OptionType,
  ISheet,
  OrgWorkflowStep,
  SheetLevel,
} from '../../model';
import { Box, IconButton, styled } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import PublishOffIcon from '@mui/icons-material/PublicOffOutlined';
import PublishOnIcon from '@mui/icons-material/PublicOutlined';
import { useSnackBar } from '../../hoc/SnackBar';
import DataSheet from 'react-datasheet';
import Confirm from '../AlertDialog';
import {
  AddSectionPassageButtons,
  ProjButtons,
  TabActions,
  ActionHeight,
  GrowingSpacer,
  AltButton,
  PriButton,
  iconMargin,
  LightTooltip,
} from '../../control';
import 'react-datasheet/lib/react-datasheet.css';
import {
  cleanClipboard,
  localUserKey,
  LocalKey,
  rememberCurrentPassage,
  positiveWholeOnly,
} from '../../utils';
import { remoteIdGuid, useRole } from '../../crud';
import MediaPlayer from '../MediaPlayer';
import { PlanContext } from '../../context/PlanContext';
import { TabAppBar } from '../../control';
import { HotKeyContext } from '../../context/HotKeyContext';
import { UnsavedContext } from '../../context/UnsavedContext';
import FilterMenu, { ISTFilterState } from './filterMenu';
import { planSheetSelector, sharedSelector } from '../../selector';
import { useSelector, shallowEqual } from 'react-redux';
import { PassageTypeEnum } from '../../model/passageType';
import { rowTypes } from './rowTypes';
import { useRefErrTest } from './useRefErrTest';
import { ExtraIcon } from '.';
import { usePlanSheetFill } from './usePlanSheetFill';
import { useShowIcon } from './useShowIcon';
import { RecordKeyMap } from '@orbit/records';

const DOWN_ARROW = 'ARROWDOWN';
export const SectionSeqCol = 0;

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

export interface ICell {
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
  colSlugs: Array<string>;
  rowData: Array<Array<string | number>>;
  rowInfo: Array<ISheet>;
  bookSuggestions?: OptionType[];
  bookMap?: BookNameMap;
  filterState: ISTFilterState;
  maximumSection: number;
  orgSteps: OrgWorkflowStep[];
  canSetDefault: boolean;
  updateData: (changes: ICellChange[]) => void;
  updateTitleMedia: (index: number, mediaId: string) => void;
  paste: (rows: string[][]) => string[][];
  action: (what: string, where: number[]) => Promise<boolean>;
  addPassage: (ptype?: PassageTypeEnum, i?: number, before?: boolean) => void;
  movePassage: (i: number, before: boolean, section: boolean) => void;
  addSection: (level: SheetLevel, i?: number, ptype?: PassageTypeEnum) => void;
  moveSection: (i: number, before: boolean) => void;
  toggleSectionPublish: (i: number) => void;
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
  onGraphic: (i: number) => void;
  onFilterChange: (
    newstate: ISTFilterState | undefined,
    isDefault: boolean
  ) => void;
}

export function PlanSheet(props: IProps) {
  const {
    toolId,
    columns,
    colSlugs,
    rowData,
    rowInfo,
    bookSuggestions,
    bookMap,
    filterState,
    maximumSection,
    orgSteps,
    canSetDefault,
    updateData,
    updateTitleMedia,
    action,
    addPassage,
    movePassage,
    addSection,
    moveSection,
    paste,
    resequence,
    inlinePassages,
    onAudacity,
    onPassageDetail,
    onFilterChange,
    onPublishing,
    toggleSectionPublish,
  } = props;
  const ctx = useContext(PlanContext);
  const {
    hidePublishing,
    canHidePublishing,
    projButtonStr,
    connected,
    readonly,
    togglePublishing,
  } = ctx.state;

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
  const [offline] = useGlobal('offline');
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
    toolChanged,
  } = useContext(UnsavedContext).state;
  const [srcMediaId, setSrcMediaId] = useState('');
  const [mediaPlaying, setMediaPlaying] = useState(false);
  const [warning, setWarning] = useState<string>();
  const [toRow, setToRow] = useState(0);
  const t: IPlanSheetStrings = useSelector(planSheetSelector, shallowEqual);
  const ts: ISharedStrings = useSelector(sharedSelector, shallowEqual);
  const { subscribe, unsubscribe } = useContext(HotKeyContext).state;
  const { isPassage, isSection } = rowTypes(rowInfo);
  const showIcon = useShowIcon({
    readonly,
    rowInfo,
    inlinePassages,
    hidePublishing,
  });
  const [changed, setChanged] = useState(false); //for button enabling
  const changedRef = useRef(false); //for autosave
  const [saving, setSaving] = useState(false);
  const { userIsAdmin } = useRole();
  const addPublishRef = useRef<boolean | undefined>(undefined);
  const refErrTest = useRefErrTest();
  const moveUp = true;
  const moveDown = false;
  const moveToNewSection = true;

  const handleSave = () => {
    startSave();
  };

  const onPublish = () => {
    toggleSectionPublish(currentRowRef.current - 1);
  };

  const onMovementAbove = () => {
    //we'll find a section before we get past 0
    var row = currentRowRef.current - 1;
    while (!isSection(row)) row -= 1;
    addSection(SheetLevel.Movement, row, PassageTypeEnum.MOVEMENT);
  };
  const onSectionAbove = () => {
    //we'll find a section before we get past 0
    var row = currentRowRef.current - 1;
    while (!isSection(row)) row -= 1;
    addSection(SheetLevel.Section, row);
  };

  const onNote = () => {
    if (inlinePassages)
      addSection(
        SheetLevel.Section,
        currentRowRef.current,
        PassageTypeEnum.NOTE
      );
    else addPassage(PassageTypeEnum.NOTE, currentRowRef.current - 1, true);
  };
  const onPassageBelow = () => {
    addPassage(undefined, currentRowRef.current - 1, false);
  };
  const onPassageLast = () => {
    //we're on a section so find our last row and add it below it
    var row = currentRowRef.current;
    while (isPassage(row + 1)) row++;
    addPassage(undefined, row, false);
  };

  const onPassageToPrev = () => {
    //convert from currentRow with includes header
    movePassage(currentRowRef.current - 1, moveUp, moveToNewSection);
  };

  const onPassageToNext = () => {
    //convert from currentRow with includes header
    movePassage(currentRowRef.current - 1, moveDown, moveToNewSection);
  };
  const onPassageUp = () => {
    //convert from currentRow with includes header
    movePassage(currentRowRef.current - 1, moveUp, !moveToNewSection);
  };
  const onPassageDown = () => {
    //convert from currentRow with includes header
    movePassage(currentRowRef.current - 1, moveDown, !moveToNewSection);
  };
  const onSectionUp = () => {
    moveSection(currentRowRef.current - 1, moveUp);
  };
  const onSectionDown = () => {
    moveSection(currentRowRef.current - 1, moveDown);
  };
  const onSectionEnd = () => {
    addSection(SheetLevel.Section);
  };

  const onPassageEnd = () => {
    addPassage();
  };

  interface IActionMap {
    [key: number]: () => void;
  }
  const actionMap: IActionMap = {
    [ExtraIcon.Publish]: onPublish,
    [ExtraIcon.Publishing]: onPublishing,
    [ExtraIcon.Note]: onNote,
    [ExtraIcon.PassageBelow]: onPassageBelow,
    [ExtraIcon.MovementAbove]: onMovementAbove,
    [ExtraIcon.SectionAbove]: onSectionAbove,
    [ExtraIcon.PassageDown]: onPassageDown,
    [ExtraIcon.PassageToNext]: onPassageToNext,
    [ExtraIcon.PassageUp]: onPassageUp,
    [ExtraIcon.PassageToPrev]: onPassageToPrev,
    [ExtraIcon.PassageLast]: onPassageLast,
    [ExtraIcon.SectionUp]: onSectionUp,
    [ExtraIcon.SectionDown]: onSectionDown,
    [ExtraIcon.SectionEnd]: onSectionEnd,
    [ExtraIcon.PassageEnd]: onPassageEnd,
  };
  const onAction = (row: number, what: ExtraIcon) => {
    if (row + 1 !== currentRow) setCurrentRow(row + 1);
    actionMap[what]();
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

  const onPlayStatus = (mediaId: string) => {
    if (mediaId === srcMediaId) {
      setMediaPlaying(!mediaPlaying);
    } else {
      setSrcMediaId(mediaId);
    }
  };

  const handleAudacity = (i: number) => () => {
    onAudacity && onAudacity(i);
  };

  const onRecording = (recording: boolean) => {
    onSetPreventSave(recording);
    if (recording) toolChanged(toolId);
  };

  const handleCellsChanged = (changes: Array<ICellChange>) => {
    if (readonly) return; //readonly
    const colChanges = changes.map((c) => ({
      ...c,
      row: c.row - 1,
      col: !hidePublishing && canHidePublishing ? c.col - 4 : c.col - 3,
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

  const onSetPreventSave = (val: boolean) => {
    preventSave.current = val;
  };

  const doSetActive = () => setActive(currentRowRef.current);

  const disableFilter = () => {
    onFilterChange({ ...filterState, disabled: true }, false);
  };

  const planSheetFill = usePlanSheetFill({
    ...props,
    onSetPreventSave,
    doSetActive,
    disableFilter,
    onPlayStatus,
    onPassageDetail,
    onAction,
    hidePublishing,
    canHidePublishing,
    onAudacity: handleAudacity,
    onDelete: handleConfirmDelete,
    cellsChanged: updateData,
    titleMediaChanged: updateTitleMedia,
    onRecording: onRecording,
  });

  const handleAutoSave = () => {
    console.log(
      'handleAutoSave',
      changedRef.current,
      !preventSave.current,
      !global.alertOpen
    );
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
    //if we're changing from not showing to showing, add any missing
    if (userIsAdmin && addPublishRef.current === false && !hidePublishing) {
      onPublishing();
    }
    addPublishRef.current = !hidePublishing;
  }, [hidePublishing, userIsAdmin, onPublishing]);

  useEffect(() => {
    let timeoutRef: NodeJS.Timeout | undefined = undefined;
    if (rowInfo) {
      const lastPasId = localStorage.getItem(localUserKey(LocalKey.passage));
      let row = -1;
      if (lastPasId) {
        const pasGuid = remoteIdGuid(
          'passage',
          lastPasId,
          memory.keyMap as RecordKeyMap
        );
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

  const warningTest = (refCol: number) => {
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
  };

  const handlePublishToggle: MouseEventHandler<HTMLButtonElement> = () => {
    togglePublishing();
  };

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
        filterState.assignedToMe)
    );
  }, [filterState, maximumSection]);

  useEffect(() => {
    if (rowData.length !== rowInfo.length) {
      setData([]);
    } else {
      const data = planSheetFill({
        currentRow,
        srcMediaId,
        mediaPlaying,
        check,
        active,
        filtered,
      });
      if (colSlugs.indexOf('book') > -1) {
        warningTest(colSlugs.indexOf('reference'));
      }
      setData(data);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowData, rowInfo, columns, srcMediaId, mediaPlaying, currentRow, check]);

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
  const currentRowSectionSeqNum = useMemo(() => {
    if (currentRowRef.current < 1) return undefined;
    var row = currentRowRef.current - 1;
    while (row >= 0 && !isSection(row)) row--;
    return row >= 0 ? (rowData[row][SectionSeqCol] as number) : undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRow, rowData, rowInfo]);

  const currentWholeRowSectionNum = useMemo(
    () => positiveWholeOnly(currentRowSectionSeqNum),
    [currentRowSectionSeqNum]
  );

  const currentRowPassageSeqNum = useMemo(
    () =>
      currentRowRef.current < 0 || !isPassage(currentRowRef.current - 1)
        ? undefined
        : rowInfo[currentRowRef.current - 1].passage?.attributes?.sequencenum,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentRow, rowData, rowInfo, inlinePassages]
  );

  const currentWholeRowPassageNum = useMemo(
    () => positiveWholeOnly(currentRowPassageSeqNum),
    [currentRowPassageSeqNum]
  );

  const dataRowisSection = useMemo(() => {
    return isSection(currentRow - 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRow]);

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
                  sectionSequenceNumber={currentWholeRowSectionNum}
                  passageSequenceNumber={currentWholeRowPassageNum}
                  onDisableFilter={filtered ? disableFilter : undefined}
                  showIcon={showIcon(filtered, offline, currentRow - 1)}
                  onAction={(what: ExtraIcon) => onAction(currentRow - 1, what)}
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
            {!offline && !inlinePassages && !readonly && (
              <LightTooltip
                sx={{ backgroundColor: 'transparent' }}
                title={hidePublishing ? t.showPublishing : t.hidePublishing}
              >
                <IconButton onClick={handlePublishToggle}>
                  {hidePublishing ? (
                    <PublishOnIcon sx={{ color: 'primary.light' }} />
                  ) : (
                    <PublishOffIcon sx={{ color: 'primary.light' }} />
                  )}
                </IconButton>
              </LightTooltip>
            )}
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
