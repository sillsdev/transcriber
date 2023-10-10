import React, { useState, useEffect, useRef, useContext, useMemo } from 'react';
import { useGlobal } from 'reactn';
import { bindActionCreators } from 'redux';
import { connect, shallowEqual, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import {
  IState,
  Section,
  Passage,
  IPlanSheetStrings,
  IScriptureTableStrings,
  BookNameMap,
  BookName,
  ISharedStrings,
  MediaFile,
  OptionType,
  Plan,
  ISheet,
  IwsKind,
  IMediaShare,
  WorkflowStep,
  OrgWorkflowStep,
  IWorkflowStepsStrings,
  GroupMembership,
  Discussion,
  IResourceStrings,
  SheetLevel,
  Graphic,
} from '../../model';
import localStrings from '../../selector/localize';
import * as actions from '../../store';
import { withData } from 'react-orbitjs';
import Memory from '@orbit/memory';
import JSONAPISource from '@orbit/jsonapi';
import { TransformBuilder, RecordIdentity, QueryBuilder } from '@orbit/data';
import { Badge, Box, Link } from '@mui/material';
import { useSnackBar } from '../../hoc/SnackBar';
import PlanSheet, { ICellChange } from './PlanSheet';
import {
  remoteIdNum,
  related,
  useOrganizedBy,
  usePlan,
  useFilteredSteps,
  VernacularTag,
  useDiscussionCount,
  getTool,
  ToolSlug,
  remoteId,
  remoteIdGuid,
  getStartChapter,
  findRecord,
  useGraphicUpdate,
} from '../../crud';
import {
  lookupBook,
  waitForIt,
  useCheckOnline,
  currentDateTime,
  hasAudacity,
} from '../../utils';
import {
  isSectionRow,
  isPassageRow,
  shtColumnHeads,
  shtResequence,
  wfResequencePassages,
  useWfLocalSave,
  useWfOnlineSave,
  useWfPaste,
  shtNumChanges,
  getSheet,
  workSheet,
  isSectionFiltered,
  isPassageFiltered,
  nextNum,
  ApmDim,
} from '.';
import { debounce } from 'lodash';
import AudacityManager from './AudacityManager';
import AssignSection from '../AssignSection';
import StickyRedirect from '../StickyRedirect';
import Uploader from '../Uploader';
import { useMediaAttach } from '../../crud/useMediaAttach';
import { UpdateRecord } from '../../model/baseModel';
import { PlanContext } from '../../context/PlanContext';
import stringReplace from 'react-string-replace';
import BigDialog from '../../hoc/BigDialog';
import VersionDlg from '../AudioTab/VersionDlg';
import ResourceTabs from '../ResourceEdit/ResourceTabs';
import { passageDefaultFilename } from '../../utils/passageDefaultFilename';
import { UnsavedContext } from '../../context/UnsavedContext';
import { ISTFilterState } from './filterMenu';
import { useProjectDefaults } from '../../crud/useProjectDefaults';
import { sharedResourceSelector } from '../../selector';
import { PassageTypeEnum } from '../../model/passageType';
import { passageTypeFromRef, isPublishingTitle } from '../../control/RefRender';
import { UploadType } from '../MediaUpload';
import { useGraphicCreate } from '../../crud/useGraphicCreate';
import {
  CompressedImages,
  GraphicUploader,
  IGraphicInfo,
} from '../GraphicUploader';
import Confirm from '../AlertDialog';

const SaveWait = 500;
export const FilterParam = 'ProjectFilter';

interface IStateProps {
  t: IScriptureTableStrings;
  wfStr: IWorkflowStepsStrings;
  s: IPlanSheetStrings;
  ts: ISharedStrings;
  lang: string;
  bookSuggestions: OptionType[];
  bookMap: BookNameMap;
  allBookData: BookName[];
}

interface IDispatchProps {
  fetchBooks: typeof actions.fetchBooks;
}

interface IRecordProps {
  passages: Array<Passage>;
  sections: Array<Section>;
  mediafiles: Array<MediaFile>;
  graphics: Array<Graphic>;
  discussions: Array<Discussion>;
  groupmemberships: Array<GroupMembership>;
  workflowSteps: WorkflowStep[];
  orgWorkflowSteps: OrgWorkflowStep[];
}

interface IProps {
  colNames: string[];
}

interface AudacityInfo {
  ws: ISheet;
  index: number;
}

export function ScriptureTable(
  props: IProps & IStateProps & IDispatchProps & IRecordProps
) {
  const {
    t,
    wfStr,
    s,
    ts,
    lang,
    colNames,
    bookSuggestions,
    bookMap,
    allBookData,
    fetchBooks,
    passages,
    sections,
    mediafiles,
    graphics,
    discussions,
    groupmemberships,
    workflowSteps,
    orgWorkflowSteps,
  } = props;
  const { prjId } = useParams();
  const [width, setWidth] = React.useState(window.innerWidth);
  const [project] = useGlobal('project');
  const [plan] = useGlobal('plan');
  const [coordinator] = useGlobal('coordinator');
  const [offline] = useGlobal('offline');
  const memory = coordinator.getSource('memory') as Memory;
  const remote = coordinator.getSource('remote') as JSONAPISource;
  const [user] = useGlobal('user');
  const [org] = useGlobal('organization');
  const [offlineOnly] = useGlobal('offlineOnly');
  const [, setBusy] = useGlobal('importexportBusy');
  const myChangedRef = useRef(false);
  const savingRef = useRef(false);
  const updateRef = useRef(false);
  const { showMessage } = useSnackBar();
  const ctx = React.useContext(PlanContext);
  const { flat, scripture, shared } = ctx.state;
  const { getOrganizedBy } = useOrganizedBy();
  const [organizedBy] = useState<string>(getOrganizedBy(true));
  const [saveColAdd, setSaveColAdd] = useState<number[]>();
  const [columns, setColumns] = useState([
    { value: organizedBy, readOnly: true, width: 80 },
    { value: t.title, readOnly: true, width: 280 },
    { value: t.passage, readOnly: true, width: 80 },
    { value: t.reference, readOnly: true, width: 180 },
    { value: t.description, readOnly: true, width: 280 },
  ]);
  const [sheet, setSheetx] = useState<ISheet[]>([]);
  const workflowRef = useRef<ISheet[]>([]);
  const [, setComplete] = useGlobal('progress');
  const [confirmPublishingVisible, setConfirmPublishingVisible] =
    useState(false);
  const [view, setView] = useState('');
  const [audacityItem, setAudacityItem] = React.useState<AudacityInfo>();
  const [lastSaved, setLastSaved] = React.useState<string>();
  const toolId = 'scriptureTable';
  const {
    saveRequested,
    startSave,
    saveCompleted,
    clearRequested,
    clearCompleted,
    waitForSave,
    toolChanged,
    toolsChanged,
    isChanged,
  } = useContext(UnsavedContext).state;
  const [assignSectionVisible, setAssignSectionVisible] = useState(false);
  const [assignSections, setAssignSections] = useState<number[]>([]);
  const [uploadVisible, setUploadVisible] = useState(false);
  const [uploadGraphicVisible, setUploadGraphicVisible] = useState(false);
  const [recordAudio, setRecordAudio] = useState(true);
  const [importList, setImportList] = useState<File[]>();
  const cancelled = useRef(false);
  const uploadItem = useRef<ISheet>();
  const [versionItem, setVersionItem] = useState('');
  const [isNote, setIsNote] = useState(false);
  const [defaultFilename, setDefaultFilename] = useState('');
  const [uploadType, setUploadType] = useState<UploadType>();
  const graphicCreate = useGraphicCreate();
  const graphicUpdate = useGraphicUpdate();
  const { getPlan } = usePlan();
  const localSave = useWfLocalSave({ setComplete });
  const onlineSave = useWfOnlineSave({ setComplete });
  const [detachPassage] = useMediaAttach({
    ...props,
  });
  const checkOnline = useCheckOnline();
  const [speaker, setSpeaker] = useState('');
  const getStepsBusy = useRef(false);
  const [orgSteps, setOrgSteps] = useState<OrgWorkflowStep[]>([]);
  const {
    getProjectDefault,
    setProjectDefault,
    canSetProjectDefault,
    getLocalDefault,
    setLocalDefault,
  } = useProjectDefaults();
  const getFilteredSteps = useFilteredSteps();
  const getDiscussionCount = useDiscussionCount({
    mediafiles,
    discussions,
    groupmemberships,
  });
  const [defaultFilterState, setDefaultFilterState] = useState<ISTFilterState>({
    minStep: '', //orgworkflow step to show this step or after
    maxStep: '', //orgworkflow step to show this step or before
    hideDone: false,
    minSection: 1,
    maxSection: -1,
    assignedToMe: false,
    disabled: false,
    canHideDone: true,
    canHidePublishing: true,
    hidePublishing: true,
  });
  const resStr: IResourceStrings = useSelector(
    sharedResourceSelector,
    shallowEqual
  );

  const [filterState, setFilterState] =
    useState<ISTFilterState>(defaultFilterState);
  const secNumCol = React.useMemo(() => {
    return colNames.indexOf('sectionSeq');
  }, [colNames]);
  const local: ILocal = {
    sectionSeq: organizedBy,
    title: t.title,
    passageSeq: t.passage,
    book: t.book,
    reference: t.reference,
    comment: t.description,
    action: t.extras,
  };
  const onFilterChange = (
    filter: ISTFilterState | undefined,
    projDefault: boolean
  ) => {
    setLocalDefault(FilterParam, filter);
    if (projDefault) {
      var def;
      if (filter) {
        def = { ...filter };
        //convert steps to remote id
        if (filter.minStep)
          def.minStep = remoteId(
            'orgworkflowstep',
            filter.minStep,
            memory.keyMap
          );
        if (filter.maxStep)
          def.maxStep = remoteId(
            'orgworkflowstep',
            filter.maxStep,
            memory.keyMap
          );
      }
      setProjectDefault(FilterParam, def);
    }
    if (filter) setFilterState(() => filter);
    else setFilterState(getFilter(defaultFilterState));
  };
  const setSheet = (ws: ISheet[]) => {
    workflowRef.current = ws;
    setSheetx(ws);
    var anyPublishing = Boolean(
      ws.find((w) => isPublishingTitle(w.reference ?? '', flat))
    );
    if (defaultFilterState.canHidePublishing !== anyPublishing)
      setDefaultFilterState((fs) => ({
        ...fs,
        canHidePublishing: anyPublishing,
      }));
  };
  const passNumCol = React.useMemo(() => {
    return colNames.indexOf('passageSeq');
  }, [colNames]);

  const findBook = (val: string) =>
    lookupBook({ book: val, allBookData, bookMap });

  const paste = useWfPaste({
    secNumCol,
    passNumCol,
    scripture,
    flat,
    shared,
    colNames,
    findBook,
    t,
  });

  const setChanged = (value: boolean) => {
    myChangedRef.current = value;
    toolChanged(toolId, value);
  };

  const handleResequence = () => {
    if (savingRef.current) {
      showMessage(t.saving);
      return;
    }
    const ws = shtResequence(sheet);
    if (ws !== sheet) {
      setSheet(ws);
      setChanged(true);
    }
  };

  const insertAt = (arr: Array<any>, item: any, index?: number) => {
    if (index === undefined) {
      return [...arr.concat([item])];
    } else {
      const newArr = arr.map((v, i) =>
        i < index ? v : i === index ? item : arr[i - 1]
      );
      return [...newArr.concat([arr.pop()])];
    }
  };

  const updateRowAt = (arr: Array<any>, item: any, index: number) => {
    const newArr = arr.map((v, i) =>
      i < index ? v : i === index ? item : arr[i]
    );
    return newArr;
  };

  /*
  const xmovePassageDown = (data: ISheet[], index: number) => {
    var origrowid = { ...data[index] };
    var newrowid = { ...data[index + 1] };

    if (scripture) {
      newrowid.book = origrowid.book;
    }
    newrowid.reference = origrowid.reference;
    origrowid.reference = '';
    newrowid.title = origrowid.title;
    origrowid.title = '';
    data[index] = origrowid;
    data[index + 1] = newrowid;
  };
*/

  const SkipPublishing = true;
  const NoSkip = false;
  const findSection = (
    myWorkflow: ISheet[],
    sectionIndex: number,
    before: boolean,
    skipPublishing: boolean
  ) => {
    while (
      sectionIndex >= 0 &&
      sectionIndex < myWorkflow.length &&
      (myWorkflow[sectionIndex].deleted || skipPublishing
        ? myWorkflow[sectionIndex].level !== SheetLevel.Section
        : !isSectionRow(myWorkflow[sectionIndex]))
    ) {
      sectionIndex = sectionIndex + (before ? -1 : 1);
    }
    if (sectionIndex < 0 || sectionIndex === myWorkflow.length) return -1;
    return sectionIndex;
  };

  const swapRows = (myWorkflow: ISheet[], i: number, j: number) => {
    let passageRow = { ...myWorkflow[i] };
    let swapRow = { ...myWorkflow[j] };
    return updateRowAt(updateRowAt(myWorkflow, passageRow, j), swapRow, i);
  };

  const movePassageTo = (myWorkflow: ISheet[], i: number, before: boolean) => {
    let mySectionIndex = findSection(myWorkflow, i, true, NoSkip);
    myWorkflow = swapRows(myWorkflow, i, before ? i - 1 : i + 1);
    return wfResequencePassages(myWorkflow, mySectionIndex, flat);
  };

  const movePassageToNextSection = (
    myWorkflow: ISheet[],
    i: number,
    before: boolean
  ) => {
    let passageRow = { ...myWorkflow[i] };
    let originalSectionIndex = findSection(
      myWorkflow,
      i,
      before,
      SkipPublishing
    );
    let newSectionIndex = findSection(
      myWorkflow,
      before ? originalSectionIndex - 1 : i,
      before,
      SkipPublishing
    );
    if (newSectionIndex < 0) return;
    let endRowIndex = before ? originalSectionIndex : newSectionIndex;
    passageRow.sectionSeq = myWorkflow[newSectionIndex].sectionSeq;
    passageRow.passageUpdated = currentDateTime();

    if (before) {
      //skip movements
      while (
        findSection(myWorkflow, endRowIndex - 1, true, NoSkip) < endRowIndex
      )
        endRowIndex = findSection(myWorkflow, endRowIndex - 1, true, false);

      while (i > endRowIndex) {
        myWorkflow = swapRows(myWorkflow, i, i - 1);
        i--;
      }
      myWorkflow = wfResequencePassages(
        wfResequencePassages(myWorkflow, originalSectionIndex + 1, flat),
        newSectionIndex,
        flat
      );
    } else {
      while (
        endRowIndex < myWorkflow.length - 2 &&
        (myWorkflow[endRowIndex].deleted ||
          myWorkflow[endRowIndex + 1].passageType !== PassageTypeEnum.PASSAGE)
      )
        endRowIndex++;
      while (i < endRowIndex) {
        myWorkflow = swapRows(myWorkflow, i, i + 1);
        i++;
      }
      myWorkflow = wfResequencePassages(
        wfResequencePassages(myWorkflow, originalSectionIndex, flat),
        newSectionIndex - 1,
        flat
      );
    }

    setSheet(myWorkflow);
    setChanged(true);
  };

  const addPassageTo = (
    level: SheetLevel,
    myWorkflow: ISheet[],
    ptype: PassageTypeEnum | undefined,
    i?: number,
    before?: boolean,
    title?: string
  ) => {
    let lastRow = myWorkflow.length - 1;
    while (lastRow >= 0 && myWorkflow[lastRow].deleted) lastRow -= 1;
    let index = i === undefined && lastRow >= 0 ? lastRow : i || 0;
    if (ptype === PassageTypeEnum.MOVEMENT && !flat)
      ptype = PassageTypeEnum.TITLE;
    let newRow = {
      ...myWorkflow[index],
      level: flat && level ? level : SheetLevel.Passage,
      kind: flat ? IwsKind.SectionPassage : IwsKind.Passage,
      book: firstBook(),
      reference: ptype ?? '',
      mediaId: undefined,
      comment: title ?? '',
      passageUpdated: currentDateTime(),
      passage: undefined,
      passageType: ptype ?? PassageTypeEnum.PASSAGE,
      mediaShared: shared ? IMediaShare.None : IMediaShare.NotPublic,
      deleted: false,
      filtered: false,
    } as ISheet;

    if (flat && isSectionRow(myWorkflow[index])) {
      //no passage on this row yet
      myWorkflow = wfResequencePassages(
        updateRowAt(myWorkflow, newRow, index),
        index,
        flat
      );
      return myWorkflow;
    } else {
      myWorkflow = insertAt(
        myWorkflow,
        newRow,
        index < lastRow ? index + 1 : undefined
      );
      /* how could this have ever been true? We've checked flat and section row above
      if (
        before &&
        isSectionRow(myWorkflow[index]) &&
        isPassageRow(myWorkflow[index])
      ) {
        //move passage data from section row to new empty row
        xmovePassageDown(myWorkflow, index);
      } */
      while (index >= 0 && !isSectionRow(myWorkflow[index])) index -= 1;
      return wfResequencePassages(myWorkflow, index, flat);
    }
  };

  const getUndelIndex = (sheet: ISheet[], ix: number | undefined) => {
    // find the undeleted index...
    if (ix !== undefined) return getByIndex(sheet, ix).i;
    return ix;
  };
  const nextSecSequence = (
    ws: ISheet[],
    i?: number,
    flattype?: PassageTypeEnum
  ) => {
    const sequenceNums = ws.map((row, j) =>
      !i || j < i ? (!row.deleted && row.sectionSeq) || 0 : 0
    ) as number[];
    return nextNum(Math.max(...sequenceNums, 0), flattype);
  };
  const newSection = (
    level: SheetLevel,
    ws: ISheet[],
    i?: number,
    type?: PassageTypeEnum
  ) => {
    let newRow = {
      level,
      kind: flat ? IwsKind.SectionPassage : IwsKind.Section,
      sectionSeq: nextSecSequence(ws, i, type),
      passageSeq: 0,
      reference: '',
      published: false,
    } as ISheet;
    let prevRowIdx = i ? i - 1 : ws.length - 1;
    if (prevRowIdx >= 0) newRow.book = ws[prevRowIdx].book;
    return newRow;
  };
  const addSection = (
    level: SheetLevel,
    ix?: number,
    ptype?: PassageTypeEnum
  ) => {
    if (savingRef.current) {
      showMessage(t.saving);
      return;
    }
    const i = getUndelIndex(sheet, ix);
    let newData = insertAt(sheet, newSection(level, sheet, i), i);
    //if added in the middle...resequence
    if (i !== undefined) newData = shtResequence(newData);
    setSheet(addPassageTo(level, newData, ptype, i));
    setChanged(true);
  };

  const addPassage = (
    ptype?: PassageTypeEnum,
    ix?: number,
    before?: boolean
  ) => {
    if (savingRef.current) {
      showMessage(t.saving);
      return;
    }
    const i = getUndelIndex(sheet, ix);
    setSheet(addPassageTo(SheetLevel.Passage, sheet, ptype, i, before));
    setChanged(true);
  };
  const movePassage = (ix: number, before: boolean, nextSection: boolean) => {
    if (savingRef.current) {
      showMessage(t.saving);
      return;
    }
    if (flat) return;
    const i = getUndelIndex(sheet, ix);
    if (i !== undefined) {
      if (nextSection) movePassageToNextSection(sheet, i, before);
      else setSheet(movePassageTo(sheet, i, before));
      setChanged(true);
    }
  };
  const getByIndex = (ws: ISheet[], index: number) => {
    let n = 0;
    let i = 0;
    while (i < ws.length) {
      if (!ws[i].deleted && !ws[i].filtered) {
        if (n === index) break;
        n += 1;
      }
      i += 1;
    }
    return { ws: i < ws.length ? ws[i] : undefined, i };
  };

  const doDetachMedia = async (ws: ISheet | undefined) => {
    if (!ws) return false;
    if (ws.passage) {
      var attached = mediafiles.filter(
        (m) => related(m, 'passage') === ws.passage?.id
      );
      for (let ix = 0; ix < attached.length; ix++) {
        await detachPassage(
          ws.passage?.id || '',
          related(ws.passage, 'section'),
          plan,
          attached[ix].id
        );
      }
    }
    return true;
  };

  const markDelete = async (index: number) => {
    const { ws, i } = getByIndex(sheet, index);
    const removeItem: number[] = [];

    const doDelete = (j: number, isSec?: boolean) => {
      if ((isSec && sheet[j].sectionId) || (!isSec && sheet[j].passage)) {
        sheet[j] = { ...sheet[j], deleted: true };
      } else {
        removeItem.push(j);
      }
    };

    if (ws) {
      if (isSectionRow(ws)) {
        let j = i;
        let isSec = true;
        while (j < sheet.length) {
          doDelete(j, isSec);
          j += 1;
          isSec = false;
          if (j === sheet.length) break;
          if (isSectionRow(sheet[j])) break;
        }
      } else doDelete(i);
      const myWork: ISheet[] = [];
      sheet.forEach((ws, i) => {
        if (!removeItem.includes(i)) myWork.push(ws);
      });
      setSheet([...shtResequence(myWork)]);
      setChanged(true);
    }
  };

  const handleDelete = async (what: string, where: number[]) => {
    if (what === 'Delete') {
      await waitForIt(
        'saving before delete',
        () => {
          console.log('waiting for save before deleting.');
          return !savingRef.current;
        },
        () => false,
        1500
      );
      await markDelete(where[0]);
      return true;
    }
    return false;
  };

  const getSectionsWhere = (where: number[]) => {
    let selected = Array<Section>();
    where.forEach((c) => {
      const { ws } = getByIndex(sheet, c);
      let one = sections.find((s) => s.id === ws?.sectionId?.id);
      if (one) selected.push(one);
    });
    return selected;
  };

  const handleTablePaste = (rows: string[][]) => {
    if (savingRef.current) {
      showMessage(t.saving);
      return Array<Array<string>>();
    }
    const { valid, addedWorkflow } = paste(rows);
    if (valid) {
      setSheet(sheet.concat(addedWorkflow));
      setChanged(true);
      return Array<Array<string>>();
    }
    return rows;
  };

  const isValidNumber = (value: string): boolean => {
    return /^-?[0-9.]+$/.test(value);
  };

  interface MyWorkflow extends ISheet {
    [key: string]: any;
  }
  const updateData = (changes: ICellChange[]) => {
    changes.forEach((c) => {
      const { ws, i } = getByIndex(sheet, c.row);
      const myWf = ws as MyWorkflow | undefined;
      const name = colNames[c.col];
      const isNumberCol = c.col === secNumCol || c.col === passNumCol;

      if (isNumberCol && !isValidNumber(c.value || '')) {
        showMessage(s.nonNumber);
      } else if (myWf && myWf[name] !== c.value) {
        const isSection = c.col < 2;
        const sectionUpdated = isSection
          ? currentDateTime()
          : ws?.sectionUpdated;
        const passageUpdated = isSection
          ? ws?.passageUpdated
          : currentDateTime();
        const value = name === 'book' ? findBook(c.value as string) : c.value;
        var passageType =
          name === 'reference'
            ? passageTypeFromRef(c.value as string, flat)
            : ws?.passageType;

        sheet[i] = {
          ...ws,
          [name]: isNumberCol ? parseInt(value ?? '') : value,
          sectionUpdated,
          passageUpdated,
          passageType,
        } as ISheet;
      }
    });
    if (changes.length > 0) {
      setSheet([...sheet]);
      setChanged(true);
    }
  };

  const saveIfChanged = (cb: () => void) => {
    if (myChangedRef.current) {
      startSave();
      waitForSave(() => cb(), SaveWait);
    } else cb();
  };
  const waitForPassageId = (i: number, cb: () => void) => {
    waitForIt(
      'passageId to be set',
      () => {
        return getByIndex(workflowRef.current, i).ws?.passage !== undefined;
      },
      () => false,
      SaveWait
    ).then(() => cb());
  };

  const handlePassageDetail = (i: number) => {
    saveIfChanged(async () => {
      waitForPassageId(i, () => {
        const { ws } = getByIndex(workflowRef.current, i);
        const id = ws?.passage?.id || '';
        const passageRemoteId = remoteIdNum('passage', id, memory.keyMap) || id;
        setView(`/detail/${prjId}/${passageRemoteId}`);
      });
    });
  };

  const handleAudacity = async (index: number) => {
    if (!(await hasAudacity())) {
      showMessage(
        <span>
          {stringReplace(t.installAudacity, '{Audacity}', () => (
            <Link
              href="https://www.audacityteam.org/download/"
              target="_blank"
              rel="noopener noreferrer"
            >
              'Audacity'
            </Link>
          ))}
        </span>
      );
      return;
    }
    saveIfChanged(() => {
      waitForPassageId(index, () => {
        const { ws } = getByIndex(workflowRef.current, index);
        setAudacityItem({ ws: ws as ISheet, index });
      });
    });
  };

  const handleAudacityClose = () => {
    setAudacityItem(undefined);
  };

  const doAssign = (where: number[]) => {
    setAssignSections(where);
    setAssignSectionVisible(true);
  };
  const handleAssign = (where: number[]) => () => {
    saveIfChanged(() => {
      doAssign(where);
    });
  };

  const handleAssignClose = () => () => setAssignSectionVisible(false);

  const showUpload = (i: number, record: boolean, list?: File[]) => {
    waitForPassageId(i, () => {
      const { ws } = getByIndex(workflowRef.current, i);
      uploadItem.current = ws;
      if (ws?.passage) {
        setDefaultFilename(
          passageDefaultFilename(
            ws?.passage,
            plan,
            memory,
            VernacularTag,
            offline
          )
        );
      }
      setRecordAudio(record);
      setImportList(list);
      setUploadVisible(true);
    });
  };

  const handleUploadVisible = (v: boolean) => {
    setUploadVisible(v);
  };

  const handleUpload = (i: number) => () => {
    saveIfChanged(() => {
      showUpload(i, false);
    });
  };

  const handleVersions = (i: number) => () => {
    saveIfChanged(() => {
      waitForPassageId(i, () => {
        const { ws } = getByIndex(workflowRef.current, i);
        setVersionItem(ws?.passage?.id || '');
        setIsNote(ws?.passageType === PassageTypeEnum.NOTE);
      });
    });
  };

  const handleUploadGraphicVisible = (v: boolean) => {
    setUploadType(undefined);
    setUploadGraphicVisible(v);
  };

  const handleGraphic = (i: number) => {
    saveIfChanged(() => {
      setUploadType(UploadType.Graphic);
      const { ws } = getByIndex(workflowRef.current, i);
      const secId = ws?.sectionId?.id ?? related(ws?.passage, 'section');
      const secRec = secId
        ? (findRecord(memory, 'section', secId) as Section)
        : undefined;
      const planId = related(secRec, 'plan') as string | undefined;
      const planRec = planId
        ? (findRecord(memory, 'plan', planId) as Plan)
        : undefined;
      const defaultName =
        ws?.kind === IwsKind.Section
          ? `${planRec?.attributes.name ?? ''}_${ws?.sectionSeq}_${
              planRec?.keys?.remoteId || planRec?.id
            }_${secRec?.keys?.remoteId || secRec?.id}_graphic`
          : `${ws?.book ?? ''}_${ws?.reference ?? ''}_${ws?.sectionSeq ?? ''}_${
              ws?.passageSeq ?? ''
            }_${planRec?.keys?.remoteId || planRec?.id}_${
              secRec?.keys?.remoteId || secRec?.id
            }_${ws?.passage?.keys?.remoteId || ws?.passage?.id}_graphic`;
      console.log(`defaultName: ${defaultName}`);
      setDefaultFilename(defaultName);
      uploadItem.current = ws;
      setUploadGraphicVisible(true);
    });
  };

  const afterConvert = async (images: CompressedImages[]) => {
    const ws = uploadItem.current;
    const resourceType = ws?.kind === IwsKind.Section ? 'section' : 'passage';
    const secRec =
      ws?.kind === IwsKind.Section
        ? (findRecord(memory, 'section', ws?.sectionId?.id ?? '') as Section)
        : undefined;
    const resourceId =
      ws?.kind === IwsKind.Section
        ? parseInt(secRec?.keys?.remoteId ?? '0')
        : parseInt(ws?.passage?.keys?.remoteId ?? '0');
    const infoData: IGraphicInfo = {};
    images.forEach((image) => {
      infoData[image.dimension.toString()] = image;
    });
    const info = JSON.stringify(infoData);
    const graphicRec = graphics.find(
      (g) =>
        g.attributes.resourceType === resourceType &&
        g.attributes.resourceId === resourceId
    );
    if (graphicRec) {
      await graphicUpdate({
        ...graphicRec,
        attributes: { ...graphicRec.attributes, info },
      });
    } else {
      await graphicCreate({ resourceType, resourceId, info });
    }
    setUploadType(undefined);
  };

  const handleAudacityImport = (i: number, list: File[]) => {
    saveIfChanged(() => {
      showUpload(i, false, list);
    });
  };

  const handleRecord = (i: number) => {
    saveIfChanged(() => {
      showUpload(i, true);
    });
  };

  const handleVerHistClose = () => {
    setVersionItem('');
  };

  const handleNameChange = (name: string) => {
    setSpeaker(name);
  };

  const updateLastModified = async () => {
    var planRec = getPlan(plan) as Plan;
    if (planRec !== null) {
      //don't use sections here, it hasn't been updated yet
      var plansections = memory.cache.query((qb) =>
        qb.findRecords('section')
      ) as Section[];
      planRec.attributes.sectionCount = plansections.filter(
        (s) => related(s, 'plan') === plan
      ).length;
      try {
        if (remote)
          await waitForIt(
            'priorsave',
            () => remote.requestQueue.length === 0,
            () => false,
            200
          );
      } finally {
        //do this even if the wait above failed
        await memory.update((t: TransformBuilder) =>
          UpdateRecord(t, planRec, user)
        );
      }
    }
  };

  const getLastModified = (plan: string) => {
    if (plan) {
      var planRec = getPlan(plan);
      if (planRec !== null) setLastSaved(planRec.attributes.dateUpdated);
      else setLastSaved('');
    }
  };

  // keep track of screen width
  const setDimensions = () => {
    setWidth(window.innerWidth);
  };

  useEffect(() => {
    setDimensions();
    const handleResize = debounce(() => {
      setDimensions();
    }, 100);

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); //do this once to get the default;

  const getFilter = (fs: ISTFilterState) => {
    var filter =
      getLocalDefault(FilterParam) ?? getProjectDefault(FilterParam) ?? fs;

    if (filter.minStep && !isNaN(Number(filter.minStep)))
      filter.minStep = remoteIdGuid(
        'orgworkflowstep',
        filter.minStep,
        memory.keyMap
      );
    if (filter.maxStep && !isNaN(Number(filter.maxStep)))
      filter.maxStep = remoteIdGuid(
        'orgworkflowstep',
        filter.maxStep,
        memory.keyMap
      );
    filter.canHidePublishing = fs.canHidePublishing;
    filter.hidePublishing = filter.canHidePublishing && filter.hidePublishing;
    return filter;
  };
  useEffect(() => {
    setFilterState(getFilter(defaultFilterState));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project, defaultFilterState]);

  useEffect(() => {
    if (!getStepsBusy.current) {
      getStepsBusy.current = true;
      getFilteredSteps((orgSteps) => {
        getStepsBusy.current = false;
        setOrgSteps(
          orgSteps.sort(
            (i, j) => i.attributes.sequencenum - j.attributes.sequencenum
          )
        );
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workflowSteps, orgWorkflowSteps, org]);

  const doneStepId = useMemo(() => {
    if (getStepsBusy.current) return 'notready';
    var tmp = orgSteps.find(
      (s) => getTool(s.attributes?.tool) === ToolSlug.Done
    );

    if (defaultFilterState.canHideDone !== Boolean(tmp))
      setDefaultFilterState((fs) => ({
        ...fs,
        canHideDone: Boolean(tmp),
      }));
    return tmp?.id ?? 'noDoneStep';
  }, [defaultFilterState, orgSteps]);

  // Save locally or online in batches
  useEffect(() => {
    let prevSave = '';
    const handleSave = async () => {
      const numChanges = shtNumChanges(sheet, prevSave);

      if (numChanges === 0) return;
      for (const ws of sheet) {
        if (ws.deleted) await doDetachMedia(ws);
      }
      setComplete(10);
      const saveFn = async (sheet: ISheet[]) => {
        if (!offlineOnly && numChanges > 10) {
          return await onlineSave(sheet, prevSave);
        } else {
          await localSave(sheet, sections, passages, prevSave);
          return false;
        }
      };
      if (numChanges > 50) setBusy(true);
      let change = false;
      let start = 0;
      if (!offlineOnly) {
        let end = 200;
        for (; start + 200 < sheet.length; start += end) {
          setComplete(Math.floor((90 * start) / numChanges) + 10);
          end = 200;
          while (!isSectionRow(sheet[start + end]) && end > 0) end -= 1;
          if (end === 0) {
            //find the end
            end = 200;
            while (end < sheet.length && !isSectionRow(sheet[start + end]))
              end++;
          }
          change = (await saveFn(sheet.slice(start, start + end))) || change;
        }
      }
      change = (await saveFn(sheet.slice(start))) || change;
      //update plan section count and lastmodified
      await updateLastModified();
      //not sure we need to do this because its going to be requeried next
      if (change) setSheet([...sheet]);
      setBusy(false);
    };
    const setSaving = (value: boolean) => (savingRef.current = value);
    const save = () => {
      if (!savingRef.current && !updateRef.current) {
        setSaving(true);
        setChanged(false);
        prevSave = lastSaved || '';
        showMessage(t.saving);
        handleSave().then(() => {
          setSaving(false);
          setLastSaved(currentDateTime()); //force refresh the sheet
          saveCompleted(toolId);
          setComplete(100);
        });
      }
    };
    myChangedRef.current = isChanged(toolId);
    if (saveRequested(toolId)) {
      if (offlineOnly) {
        save();
      } else {
        checkOnline((online) => {
          if (!online) {
            saveCompleted(toolId, ts.NoSaveOffline);
            showMessage(ts.NoSaveOffline);
            setSaving(false);
          } else {
            save();
          }
        });
      }
    } else if (clearRequested(toolId)) clearCompleted(toolId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toolsChanged]);

  // load data when tables change (and initally)
  useEffect(() => {
    if (scripture && allBookData.length === 0) fetchBooks(lang);
    const setUpdate = (value: boolean) => (updateRef.current = value);
    if (
      !savingRef.current &&
      !myChangedRef.current &&
      plan &&
      !updateRef.current
    ) {
      setUpdate(true);
      const newWorkflow = getSheet(
        plan,
        sections,
        passages,
        graphics,
        flat,
        shared,
        memory,
        orgSteps,
        wfStr,
        filterState,
        doneStepId,
        getDiscussionCount
      );
      setSheet(newWorkflow);

      getLastModified(plan);
      setUpdate(false);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    plan,
    sections,
    passages,
    mediafiles,
    graphics,
    flat,
    shared,
    orgSteps,
    lastSaved,
  ]);

  interface ILocal {
    [key: string]: any;
  }

  // Reset column widths based on sheet content
  useEffect(() => {
    const curNames = [...colNames.concat(['action'])];

    const minWidth = {
      sectionSeq: 60,
      title: 100,
      passageSeq: 60,
      book: 170,
      reference: 120,
      comment: 100,
      action: 50,
    };
    const { colHead, colAdd } = shtColumnHeads(
      sheet,
      width,
      curNames,
      local,
      minWidth
    );
    let change = saveColAdd === undefined;
    saveColAdd?.forEach((n, i) => {
      change = change || n !== colAdd[i];
    });
    curNames.forEach((n, i) => {
      if (local.hasOwnProperty(n))
        change = change || local[n] !== columns[i].value;
    });
    if (change) {
      setColumns([...colHead]);
      setSaveColAdd([...colAdd]);
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [sheet, width, colNames, flat]);

  useEffect(() => {
    const newWork: ISheet[] = [];
    var changed = false;
    workflowRef.current.forEach((w, index) => {
      var filtered = false;
      if (isSectionRow(w)) {
        filtered = isSectionFiltered(filterState, w.sectionSeq);
        if (
          !filtered &&
          filterState.hidePublishing &&
          w.kind === IwsKind.Section
        ) {
          var allMyPassagesArePublishing = true;
          for (
            var ix = index + 1;
            ix < workflowRef.current.length &&
            isPassageRow(workflowRef.current[ix]) &&
            allMyPassagesArePublishing;
            ix++
          ) {
            if (!isPublishingTitle(workflowRef.current[ix].reference, flat)) {
              allMyPassagesArePublishing = false;
            }
          }
          filtered = allMyPassagesArePublishing;
        }
      }

      if (isPassageRow(w))
        filtered =
          filtered || isPassageFiltered(w, filterState, orgSteps, doneStepId);
      if (filtered !== w.filtered) changed = true;
      newWork.push({
        ...w,
        filtered,
      });
    });
    if (changed) {
      setSheet(newWork);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgSteps, filterState, doneStepId]);

  const firstBook = () => {
    const firstbook = sheet.findIndex((b) => b.book !== undefined);
    return sheet[firstbook]?.book ?? '';
  };

  const toggleSectionPublish = (index: number) => {
    const { ws } = getByIndex(sheet, index);
    if (ws) {
      const newwf = [...sheet];
      newwf[index] = {
        ...ws,
        published: !ws.published,
        sectionUpdated: currentDateTime(),
      };
      setSheet(newwf);
      setChanged(true);
    }
  };

  const onPublishing = () => {
    setConfirmPublishingVisible(true);
  };
  const onPublishingReject = () => {
    setConfirmPublishingVisible(false);
  };
  const onPublishingConfirm = () => {
    setConfirmPublishingVisible(false);
    const bookTitleIndex = sheet.findIndex(
      (w) => w.passageType === PassageTypeEnum.BOOK
    );
    const altBookTitleIndex = sheet.findIndex(
      (w) => w.passageType === PassageTypeEnum.ALTBOOK
    );

    const AddBook = (newwf: ISheet[]) => {
      const sequencenum = -4;
      var book = firstBook();
      const title = book ? bookMap[book] : '';

      let newRow = {
        level: SheetLevel.Book,
        kind: IwsKind.Section,
        sectionSeq: sequencenum,
        passageSeq: 0,
        reference: PassageTypeEnum.BOOK,
        title,
      } as ISheet;
      newwf = newwf.concat([newRow]);
      return addPassageTo(SheetLevel.Book, newwf, PassageTypeEnum.BOOK);
    };
    const AddAltBook = (newwf: ISheet[]) => {
      return addPassageTo(SheetLevel.Book, newwf, PassageTypeEnum.ALTBOOK);
    };

    const isKind = (
      row: number,
      kind: PassageTypeEnum,
      ws: ISheet[] = sheet
    ) => {
      return row >= 0 && row < ws.length
        ? ws[row].passageType === kind && ws[row].deleted === false
        : false;
    };
    const chapterNumberTitle = (chapter: number) => t.chapter + ' ' + chapter;

    const addChapterNumber = (newwf: ISheet[], chapter: number) => {
      const title = chapterNumberTitle(chapter);
      return addPassageTo(
        SheetLevel.Section,
        newwf,
        PassageTypeEnum.CHAPTERNUMBER,
        undefined,
        undefined,
        title
      );
    };
    const addTitle = (newwf: ISheet[], row: number) => {
      return addPassageTo(SheetLevel.Passage, newwf, PassageTypeEnum.TITLE);
    };
    const startChapter = (w: ISheet) =>
      (w.passage && w.passage.attributes.startChapter) ??
      getStartChapter(w.reference);

    const chapterChanged = (w: ISheet) =>
      w.passageType === PassageTypeEnum.PASSAGE &&
      startChapter(w) !== currentChapter;

    var currentChapter = 0;
    var newworkflow: ISheet[] = [];
    if (bookTitleIndex < 0) newworkflow = AddBook(newworkflow);
    if (altBookTitleIndex < 0) newworkflow = AddAltBook(newworkflow);
    var nextpsg = 0;
    sheet.forEach((w, index) => {
      //if flat the title has to come before the section
      //otherwise we want it as the first passage in the section
      if (isSectionRow(w)) {
        nextpsg = 0;

        //copy the section
        //we won't change sequence numbers on hierarchical
        newworkflow = newworkflow.concat([{ ...w }]);
        //do I need a chapter number?
        var vernpsg = sheet.findIndex(
          (r) =>
            !r.deleted &&
            r.passageType === PassageTypeEnum.PASSAGE &&
            r.sectionSeq === w.sectionSeq &&
            r.passageSeq > 0
        );
        if (vernpsg > 0 && chapterChanged(sheet[vernpsg])) {
          var check = index;
          var gotit = false;
          while (check++ < vernpsg) {
            if (isKind(check, PassageTypeEnum.CHAPTERNUMBER)) {
              gotit = true;
            }
          }
          if (!gotit) {
            newworkflow = addChapterNumber(
              newworkflow,
              startChapter(sheet[vernpsg])
            );
            nextpsg += 0.01;
          }
          currentChapter = startChapter(sheet[vernpsg]);
        }
        //see if my first or second passage is a title - first might be chap number
        if (
          !isKind(index + 1, PassageTypeEnum.BOOK) &&
          !isKind(index + 1, PassageTypeEnum.ALTBOOK) &&
          !isKind(index + 1, PassageTypeEnum.TITLE) &&
          !isKind(index + 2, PassageTypeEnum.TITLE)
        ) {
          newworkflow = addTitle(newworkflow, index);
          nextpsg += 0.01;
        }
      } //just a passage
      else {
        //do I need a chapter number?
        var prevrow = index - 1;
        while (sheet[prevrow].deleted) prevrow--;
        if (!isSectionRow(sheet[prevrow]) && !w.deleted && chapterChanged(w)) {
          if (
            !isKind(index - 1, PassageTypeEnum.CHAPTERNUMBER) &&
            !isKind(index - 2, PassageTypeEnum.CHAPTERNUMBER)
          ) {
            newworkflow = addChapterNumber(newworkflow, startChapter(w));
            nextpsg += 0.01;
          }
          currentChapter = startChapter(w);
        }
        nextpsg = nextNum(nextpsg, w.passageType);
        newworkflow = newworkflow.concat([
          {
            ...w,
            passageSeq: nextpsg,
            passageUpdated:
              w.passageSeq !== nextpsg ? currentDateTime() : w.passageUpdated,
          },
        ]);
      }
    });
    setSheet(newworkflow);
    setChanged(true);
  };
  const rowinfo = useMemo(() => {
    var totalSections = new Set(
      sheet.filter((w) => !w.deleted).map((w) => w.sectionSeq)
    ).size;
    var regularSections = new Set(
      sheet
        .filter(
          (w) =>
            !w.deleted &&
            w.sectionSeq > 0 &&
            Math.floor(w.sectionSeq) === w.sectionSeq
        )
        .map((w) => w.sectionSeq)
    ).size;
    var filtered = sheet.filter((w) => !w.deleted && !w.filtered);
    var showingSections = new Set(filtered.map((w) => w.sectionSeq)).size;
    if (showingSections < totalSections) {
      local.sectionSeq = (
        <Badge
          badgeContent=" "
          variant="dot"
          color="secondary"
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          {organizedBy +
            (showingSections < regularSections
              ? ' (' + showingSections + '/' + regularSections + ')'
              : '')}
        </Badge>
      );
    }
    return filtered;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sheet]);

  const rowdata = useMemo(
    () => workSheet(rowinfo, colNames, sheet),
    [rowinfo, colNames, sheet]
  );

  if (view !== '') return <StickyRedirect to={view} />;

  const afterUpload = async (planId: string, mediaRemoteIds?: string[]) => {
    uploadItem.current = undefined;
    if (importList) {
      setImportList(undefined);
      setUploadVisible(false);
    }
  };
  const isReady = () => true;

  const handleLookupBook = (book: string) =>
    lookupBook({ book, allBookData, bookMap });

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <PlanSheet
        {...props}
        columns={columns}
        colSlugs={colNames}
        rowData={rowdata}
        rowInfo={rowinfo}
        bookCol={colNames.findIndex((v) => v === 'book')}
        bookMap={bookMap}
        bookSuggestions={bookSuggestions}
        action={handleDelete}
        addSection={addSection}
        addPassage={addPassage}
        movePassage={movePassage}
        updateData={updateData}
        paste={handleTablePaste}
        lookupBook={handleLookupBook}
        resequence={handleResequence}
        inlinePassages={flat}
        onAudacity={handleAudacity}
        onPassageDetail={handlePassageDetail}
        onAssign={handleAssign}
        onUpload={handleUpload}
        onRecord={handleRecord}
        onHistory={handleVersions}
        onGraphic={handleGraphic}
        onFilterChange={onFilterChange}
        filterState={filterState}
        maximumSection={sheet[sheet.length - 1]?.sectionSeq ?? 0}
        orgSteps={orgSteps}
        canSetDefault={canSetProjectDefault}
        toolId={toolId}
        onPublishing={onPublishing}
        toggleSectionPublish={toggleSectionPublish}
      />
      {assignSectionVisible && (
        <AssignSection
          sections={getSectionsWhere(assignSections)}
          visible={assignSectionVisible}
          closeMethod={handleAssignClose()}
        />
      )}
      <Uploader
        recordAudio={recordAudio}
        allowWave={true}
        defaultFilename={defaultFilename}
        mediaId={uploadItem.current?.mediaId?.id || ''}
        importList={importList}
        isOpen={uploadVisible}
        onOpen={handleUploadVisible}
        showMessage={showMessage}
        multiple={false}
        finish={afterUpload}
        cancelled={cancelled}
        passageId={uploadItem.current?.passage?.id}
        uploadType={uploadType}
        performedBy={speaker}
        onSpeakerChange={handleNameChange}
        ready={isReady}
      />
      <GraphicUploader
        dimension={[1024, 512, ApmDim]}
        defaultFilename={defaultFilename}
        isOpen={uploadGraphicVisible}
        onOpen={handleUploadGraphicVisible}
        showMessage={showMessage}
        finish={afterConvert}
        cancelled={cancelled}
        uploadType={uploadType}
      />
      {audacityItem?.ws?.passage && (
        <AudacityManager
          item={audacityItem?.index}
          open={Boolean(audacityItem)}
          onClose={handleAudacityClose}
          passageId={
            {
              type: 'passage',
              id: audacityItem?.ws?.passage?.id,
            } as RecordIdentity
          }
          mediaId={audacityItem?.ws?.mediaId?.id || ''}
          onImport={handleAudacityImport}
          speaker={speaker}
          onSpeaker={handleNameChange}
        />
      )}
      <BigDialog
        title={
          shared
            ? resStr.resourceEdit
            : isNote
            ? resStr.noteSettings
            : ts.versionHistory
        }
        isOpen={versionItem !== ''}
        onOpen={handleVerHistClose}
      >
        {shared || isNote ? (
          <ResourceTabs passId={versionItem} onOpen={handleVerHistClose} />
        ) : (
          <VersionDlg passId={versionItem} />
        )}
      </BigDialog>
      {confirmPublishingVisible && (
        <Confirm
          title={t.confirmPublish}
          text={t.publishingWarning}
          yesResponse={onPublishingConfirm}
          noResponse={onPublishingReject}
        />
      )}
    </Box>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'scriptureTable' }),
  wfStr: localStrings(state, { layout: 'workflowSteps' }),
  s: localStrings(state, { layout: 'planSheet' }),
  ts: localStrings(state, { layout: 'shared' }),
  lang: state.strings.lang,
  bookSuggestions: state.books.suggestions,
  bookMap: state.books.map,
  allBookData: state.books.bookData,
});

const mapDispatchToProps = (dispatch: any) => ({
  ...bindActionCreators(
    {
      fetchBooks: actions.fetchBooks,
    },
    dispatch
  ),
});

const mapRecordsToProps = {
  passages: (q: QueryBuilder) => q.findRecords('passage'),
  sections: (q: QueryBuilder) => q.findRecords('section'),
  mediafiles: (q: QueryBuilder) => q.findRecords('mediafile'),
  graphics: (q: QueryBuilder) => q.findRecords('graphic'),
  discussions: (q: QueryBuilder) => q.findRecords('discussion'),
  groupmemberships: (q: QueryBuilder) => q.findRecords('groupmembership'),
  workflowSteps: (q: QueryBuilder) => q.findRecords('workflowstep'),
  orgWorkflowSteps: (q: QueryBuilder) => q.findRecords('orgworkflowstep'),
};

export default withData(mapRecordsToProps)(
  connect(mapStateToProps, mapDispatchToProps)(ScriptureTable as any) as any
) as any;
