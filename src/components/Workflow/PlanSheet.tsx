import { useState, useEffect, useRef, useContext, memo } from 'react';
import { useGlobal } from 'reactn';
import {
  IPlanSheetStrings,
  ISharedStrings,
  BookNameMap,
  OptionType,
  IWorkflow,
  RoleNames,
  OrgWorkflowStep,
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
import { remoteIdGuid } from '../../crud';
import TaskAvatar from '../TaskAvatar';
import MediaPlayer from '../MediaPlayer';
import { PlanContext } from '../../context/PlanContext';
import PlanActionMenu from './PlanActionMenu';
import { TabAppBar } from '../../control';
import PlanAudioActions from './PlanAudioActions';
import { HotKeyContext } from '../../context/HotKeyContext';
import { UnsavedContext } from '../../context/UnsavedContext';
import FilterMenu, { ISTFilterState } from './filterMenu';
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
  '& .data-grid-container .data-grid .cell.passErr': {
    backgroundColor: theme.palette.warning.main,
    textAlign: 'left',
  },
  '& .data-grid-container .data-grid .cell.pass > input': {
    backgroundColor: theme.palette.background.paper,
    textAlign: 'left',
    padding: theme.spacing(1),
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
  filterState: ISTFilterState;
  maximumSection: number;
  orgSteps: OrgWorkflowStep[];
  canSetDefault: boolean;
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
  onFilterChange: (newstate: ISTFilterState, isDefault: boolean) => void;
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
    onTranscribe,
    onAudacity,
    onPassageDetail,
    onFilterChange,
  } = props;
  const ctx = useContext(PlanContext);
  const { projButtonStr, connected, readonly } = ctx.state;

  const [isOffline] = useGlobal('offline');
  const [projRole] = useGlobal('projRole');
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
  const { startSave, toolsChanged, saveRequested, isChanged } =
    useContext(UnsavedContext).state;
  const [srcMediaId, setSrcMediaId] = useState('');
  const [mediaPlaying, setMediaPlaying] = useState(false);
  const [warning, setWarning] = useState<string>();
  const [toRow, setToRow] = useState(0);

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
    if (isPassage(row - 1)) {
      rememberCurrentPassage(memory, rowInfo[row - 1].passageId?.id ?? '');
    }
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
        row = rowInfo.findIndex((r) => r.passageId?.id === pasGuid);
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
  }, [rowInfo, sheetRef, toRow]);

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
          const iscurrent: string =
            currentRow === rowIndex + 1 ? ' currentrow ' : '';

          return [
            {
              value: passage && (
                <Badge
                  badgeContent={rowInfo[rowIndex].discussionCount}
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
                          rowIndex={rowIndex}
                          isPassage={passage}
                          mediaId={rowInfo[rowIndex].mediaId?.id || ''}
                          mediaShared={rowInfo[rowIndex].mediaShared}
                          onPlayStatus={handlePlayStatus}
                          onTranscribe={handleTranscribe}
                          onHistory={props.onHistory}
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
                  <PlanActionMenu
                    rowIndex={rowIndex}
                    isSection={section}
                    isPassage={passage}
                    readonly={readonly || check.length > 0}
                    onDelete={handleConfirmDelete}
                    onPlayStatus={handlePlayStatus}
                    onAudacity={handleAudacity}
                    onRecord={props.onRecord}
                    onUpload={props.onUpload}
                    onAssign={props.onAssign}
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
    <Box sx={{ display: 'flex' }}>
      <div>
        {projRole === RoleNames.Admin && (
          <TabAppBar position="fixed" color="default">
            <TabActions>
              <>
                <AddSectionPassageButtons
                  inlinePassages={inlinePassages}
                  numRows={rowInfo.length}
                  readonly={readonly}
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
                <AltButton
                  id="planSheetImp"
                  key="importExcel"
                  aria-label={t.tablePaste}
                  disabled={pasting || readonly}
                  onClick={handleTablePaste}
                >
                  {t.tablePaste}
                </AltButton>
                <AltButton
                  id="planSheetReseq"
                  key="resequence"
                  aria-label={t.resequence}
                  disabled={pasting || data.length < 2 || readonly}
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
                <GrowingSpacer />
                <FilterMenu
                  canSetDefault={canSetDefault}
                  state={filterState}
                  onFilterChange={onFilterChange}
                  orgSteps={orgSteps}
                  maximumSection={maximumSection}
                />
                <PriButton
                  id="planSheetSave"
                  key="save"
                  aria-label={t.save}
                  color={connected ? 'primary' : 'secondary'}
                  onClick={handleSave}
                  disabled={saving || !changed}
                >
                  {t.save}
                  <SaveIcon sx={iconMargin} />
                </PriButton>
              </>
            </TabActions>
          </TabAppBar>
        )}
        <ContentDiv id="PlanSheet" ref={sheetRef}>
          {warning && <WarningDiv>{warning}</WarningDiv>}
          <DataSheet
            data={data as any[][]}
            valueRenderer={handleValueRender}
            // dataRenderer={handleDataRender}
            onContextMenu={handleContextMenu}
            onCellsChanged={handleCellsChanged}
            parsePaste={parsePaste}
            onSelect={handleSelect}
          />
        </ContentDiv>
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
    </Box>
  );
}

export default PlanSheet;
