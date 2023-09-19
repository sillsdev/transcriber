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
  IWorkflow,
  IwfKind,
  IMediaShare,
  WorkflowStep,
  OrgWorkflowStep,
  IWorkflowStepsStrings,
  GroupMembership,
  Discussion,
  IResourceStrings,
  WorkflowLevel,
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
  wfColumnHeads,
  wfResequence,
  wfResequencePassages,
  useWfLocalSave,
  useWfOnlineSave,
  useWfPaste,
  wfNumChanges,
  getWorkflow,
  workflowSheet,
  isSectionFiltered,
  isPassageFiltered,
  nextNum,
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

const SaveWait = 500;

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
  discussions: Array<Discussion>;
  groupmemberships: Array<GroupMembership>;
  workflowSteps: WorkflowStep[];
  orgWorkflowSteps: OrgWorkflowStep[];
}

interface IProps {
  colNames: string[];
}

interface AudacityInfo {
  wf: IWorkflow;
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
  const [workflow, setWorkflowx] = useState<IWorkflow[]>([]);
  const workflowRef = useRef<IWorkflow[]>([]);
  const [, setComplete] = useGlobal('progress');
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
  const [recordAudio, setRecordAudio] = useState(true);
  const [importList, setImportList] = useState<File[]>();
  const cancelled = useRef(false);
  const uploadItem = useRef<IWorkflow>();
  const [versionItem, setVersionItem] = useState('');
  const [defaultFilename, setDefaultFilename] = useState('');
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
  const filterParam = 'ProjectFilter';
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
    setLocalDefault(filterParam, filter);
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
      setProjectDefault(filterParam, def);
    }
    if (filter) setFilterState(filter);
    else setFilterState(defaultFilterState);
  };
  const setWorkflow = (wf: IWorkflow[]) => {
    workflowRef.current = wf;
    setWorkflowx(wf);
    var anyPublishing = Boolean(
      wf.find((w) => isPublishingTitle(w.reference ?? '', flat))
    );
    if (defaultFilterState.canHidePublishing !== anyPublishing)
      setDefaultFilterState({
        ...defaultFilterState,
        canHidePublishing: anyPublishing,
      });
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
    const wf = wfResequence(workflow);
    if (wf !== workflow) {
      setWorkflow(wf);
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
  const xmovePassageDown = (data: IWorkflow[], index: number) => {
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
    myWorkflow: IWorkflow[],
    sectionIndex: number,
    before: boolean,
    skipPublishing: boolean
  ) => {
    while (
      sectionIndex >= 0 &&
      sectionIndex < myWorkflow.length &&
      (myWorkflow[sectionIndex].deleted || skipPublishing
        ? myWorkflow[sectionIndex].level !== WorkflowLevel.Section
        : !isSectionRow(myWorkflow[sectionIndex]))
    ) {
      sectionIndex = sectionIndex + (before ? -1 : 1);
    }
    if (sectionIndex < 0 || sectionIndex === myWorkflow.length) return -1;
    return sectionIndex;
  };

  const swapRows = (myWorkflow: IWorkflow[], i: number, j: number) => {
    let passageRow = { ...myWorkflow[i] };
    let swapRow = { ...myWorkflow[j] };
    return updateRowAt(updateRowAt(myWorkflow, passageRow, j), swapRow, i);
  };

  const movePassageTo = (
    myWorkflow: IWorkflow[],
    i: number,
    before: boolean
  ) => {
    let mySectionIndex = findSection(myWorkflow, i, true, NoSkip);
    myWorkflow = swapRows(myWorkflow, i, before ? i - 1 : i + 1);
    return wfResequencePassages(myWorkflow, mySectionIndex, flat);
  };

  const movePassageToNextSection = (
    myWorkflow: IWorkflow[],
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

    setWorkflow(myWorkflow);
    setChanged(true);
  };

  const addPassageTo = (
    level: WorkflowLevel,
    myWorkflow: IWorkflow[],
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
      level: flat && level ? level : WorkflowLevel.Passage,
      kind: flat ? IwfKind.SectionPassage : IwfKind.Passage,
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
    } as IWorkflow;

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

  const getUndelIndex = (workflow: IWorkflow[], ix: number | undefined) => {
    // find the undeleted index...
    if (ix !== undefined) return getByIndex(workflow, ix).i;
    return ix;
  };
  const nextSecSequence = (
    wf: IWorkflow[],
    i?: number,
    flattype?: PassageTypeEnum
  ) => {
    const sequenceNums = wf.map((row, j) =>
      !i || j < i ? (!row.deleted && row.sectionSeq) || 0 : 0
    ) as number[];
    return nextNum(Math.max(...sequenceNums, 0), flattype);
  };
  const newSection = (
    level: WorkflowLevel,
    wf: IWorkflow[],
    i?: number,
    type?: PassageTypeEnum
  ) => {
    let newRow = {
      level,
      kind: flat ? IwfKind.SectionPassage : IwfKind.Section,
      sectionSeq: nextSecSequence(wf, i, type),
      passageSeq: 0,
      reference: '',
    } as IWorkflow;
    let prevRowIdx = i ? i - 1 : wf.length - 1;
    if (prevRowIdx >= 0) newRow.book = wf[prevRowIdx].book;
    return newRow;
  };
  const addSection = (
    level: WorkflowLevel,
    ix?: number,
    ptype?: PassageTypeEnum
  ) => {
    if (savingRef.current) {
      showMessage(t.saving);
      return;
    }
    const i = getUndelIndex(workflow, ix);
    let newData = insertAt(workflow, newSection(level, workflow, i), i);
    //if added in the middle...resequence
    if (i !== undefined) newData = wfResequence(newData);
    setWorkflow(addPassageTo(level, newData, ptype, i));
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
    const i = getUndelIndex(workflow, ix);
    setWorkflow(
      addPassageTo(WorkflowLevel.Passage, workflow, ptype, i, before)
    );
    setChanged(true);
  };
  const movePassage = (ix: number, before: boolean, nextSection: boolean) => {
    if (savingRef.current) {
      showMessage(t.saving);
      return;
    }
    if (flat) return;
    const i = getUndelIndex(workflow, ix);
    if (i !== undefined) {
      if (nextSection) movePassageToNextSection(workflow, i, before);
      else setWorkflow(movePassageTo(workflow, i, before));
      setChanged(true);
    }
  };
  const getByIndex = (wf: IWorkflow[], index: number) => {
    let n = 0;
    let i = 0;
    while (i < wf.length) {
      if (!wf[i].deleted && !wf[i].filtered) {
        if (n === index) break;
        n += 1;
      }
      i += 1;
    }
    return { wf: i < wf.length ? wf[i] : undefined, i };
  };

  const doDetachMedia = async (wf: IWorkflow | undefined) => {
    if (!wf) return false;
    if (wf.passage) {
      var attached = mediafiles.filter(
        (m) => related(m, 'passage') === wf.passage?.id
      );
      for (let ix = 0; ix < attached.length; ix++) {
        await detachPassage(
          wf.passage?.id || '',
          related(wf.passage, 'section'),
          plan,
          attached[ix].id
        );
      }
    }
    return true;
  };

  const markDelete = async (index: number) => {
    const { wf, i } = getByIndex(workflow, index);
    const removeItem: number[] = [];

    const doDelete = (j: number, isSec?: boolean) => {
      if ((isSec && workflow[j].sectionId) || (!isSec && workflow[j].passage)) {
        workflow[j] = { ...workflow[j], deleted: true };
      } else {
        removeItem.push(j);
      }
    };

    if (wf) {
      if (isSectionRow(wf)) {
        let j = i;
        let isSec = true;
        while (j < workflow.length) {
          doDelete(j, isSec);
          j += 1;
          isSec = false;
          if (j === workflow.length) break;
          if (isSectionRow(workflow[j])) break;
        }
      } else doDelete(i);
      const myWork: IWorkflow[] = [];
      workflow.forEach((wf, i) => {
        if (!removeItem.includes(i)) myWork.push(wf);
      });
      setWorkflow([...wfResequence(myWork)]);
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
      const { wf } = getByIndex(workflow, c);
      let one = sections.find((s) => s.id === wf?.sectionId?.id);
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
      setWorkflow(workflow.concat(addedWorkflow));
      setChanged(true);
      return Array<Array<string>>();
    }
    return rows;
  };

  const isValidNumber = (value: string): boolean => {
    return /^-?[0-9.]+$/.test(value);
  };

  interface MyWorkflow extends IWorkflow {
    [key: string]: any;
  }
  const updateData = (changes: ICellChange[]) => {
    changes.forEach((c) => {
      const { wf, i } = getByIndex(workflow, c.row);
      const myWf = wf as MyWorkflow | undefined;
      const name = colNames[c.col];
      const isNumberCol = c.col === secNumCol || c.col === passNumCol;

      if (isNumberCol && !isValidNumber(c.value || '')) {
        showMessage(s.nonNumber);
      } else if (myWf && myWf[name] !== c.value) {
        const isSection = c.col < 2;
        const sectionUpdated = isSection
          ? currentDateTime()
          : wf?.sectionUpdated;
        const passageUpdated = isSection
          ? wf?.passageUpdated
          : currentDateTime();
        const value = name === 'book' ? findBook(c.value as string) : c.value;
        var passageType =
          name === 'reference'
            ? passageTypeFromRef(c.value as string, flat)
            : wf?.passageType;

        workflow[i] = {
          ...wf,
          [name]: isNumberCol ? parseInt(value ?? '') : value,
          sectionUpdated,
          passageUpdated,
          passageType,
        } as IWorkflow;
      }
    });
    if (changes.length > 0) {
      setWorkflow([...workflow]);
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
        return getByIndex(workflowRef.current, i).wf?.passage !== undefined;
      },
      () => false,
      SaveWait
    ).then(() => cb());
  };

  const handlePassageDetail = (i: number) => {
    saveIfChanged(async () => {
      waitForPassageId(i, () => {
        const { wf } = getByIndex(workflowRef.current, i);
        const id = wf?.passage?.id || '';
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
        const { wf } = getByIndex(workflowRef.current, index);
        setAudacityItem({ wf: wf as IWorkflow, index });
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
      const { wf } = getByIndex(workflowRef.current, i);
      uploadItem.current = wf;
      if (wf?.passage) {
        setDefaultFilename(
          passageDefaultFilename(
            wf?.passage,
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
        const { wf } = getByIndex(workflowRef.current, i);
        setVersionItem(wf?.passage?.id || '');
      });
    });
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

  const getFilter = () => {
    var filter =
      getLocalDefault(filterParam) ??
      getProjectDefault(filterParam) ??
      defaultFilterState;

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
    filter.canHidePublishing = defaultFilterState.canHidePublishing;
    filter.hidePublishing = filter.canHidePublishing && filter.hidePublishing;
    return filter;
  };
  useEffect(() => {
    setFilterState(getFilter());
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
      setDefaultFilterState({
        ...defaultFilterState,
        canHideDone: Boolean(tmp),
      });
    return tmp?.id ?? 'noDoneStep';
  }, [defaultFilterState, orgSteps]);

  // Save locally or online in batches
  useEffect(() => {
    let prevSave = '';
    const handleSave = async () => {
      const numChanges = wfNumChanges(workflow, prevSave);

      if (numChanges === 0) return;
      for (const wf of workflow) {
        if (wf.deleted) await doDetachMedia(wf);
      }
      setComplete(10);
      const saveFn = async (workflow: IWorkflow[]) => {
        if (!offlineOnly && numChanges > 10) {
          return await onlineSave(workflow, prevSave);
        } else {
          await localSave(workflow, sections, passages, prevSave);
          return false;
        }
      };
      if (numChanges > 50) setBusy(true);
      let change = false;
      let start = 0;
      if (!offlineOnly) {
        let end = 200;
        for (; start + 200 < workflow.length; start += end) {
          setComplete(Math.floor((90 * start) / numChanges) + 10);
          end = 200;
          while (!isSectionRow(workflow[start + end]) && end > 0) end -= 1;
          if (end === 0) {
            //find the end
            end = 200;
            while (
              end < workflow.length &&
              !isSectionRow(workflow[start + end])
            )
              end++;
          }
          change = (await saveFn(workflow.slice(start, start + end))) || change;
        }
      }
      change = (await saveFn(workflow.slice(start))) || change;
      //update plan section count and lastmodified
      await updateLastModified();
      //not sure we need to do this because its going to be requeried next
      if (change) setWorkflow([...workflow]);
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
          setLastSaved(currentDateTime()); //force refresh the workflow
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
      const newWorkflow = getWorkflow(
        plan,
        sections,
        passages,
        flat,
        shared,
        memory,
        orgSteps,
        wfStr,
        filterState,
        doneStepId,
        getDiscussionCount
      );
      setWorkflow(newWorkflow);

      getLastModified(plan);
      setUpdate(false);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan, sections, passages, mediafiles, flat, shared, orgSteps, lastSaved]);

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
    const { colHead, colAdd } = wfColumnHeads(
      workflow,
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
  }, [workflow, width, colNames, flat]);

  useEffect(() => {
    const newWork: IWorkflow[] = [];
    var changed = false;
    workflowRef.current.forEach((w, index) => {
      var filtered = false;
      if (isSectionRow(w)) {
        filtered = isSectionFiltered(filterState, w.sectionSeq);
        if (
          !filtered &&
          filterState.hidePublishing &&
          w.kind === IwfKind.Section
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
      setWorkflow(newWork);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgSteps, filterState, doneStepId]);

  const firstBook = () => {
    const firstbook = workflow.findIndex((b) => b.book !== undefined);
    return workflow[firstbook]?.book ?? '';
  };

  const onPublishing = () => {
    const bookTitleIndex = workflow.findIndex(
      (w) => w.passageType === PassageTypeEnum.BOOK
    );
    const altBookTitleIndex = workflow.findIndex(
      (w) => w.passageType === PassageTypeEnum.ALTBOOK
    );

    const AddBook = (newwf: IWorkflow[]) => {
      const sequencenum = -4;
      var book = firstBook();
      const title = book ? bookMap[book] : '';

      let newRow = {
        level: WorkflowLevel.Book,
        kind: IwfKind.Section,
        sectionSeq: sequencenum,
        passageSeq: 0,
        reference: PassageTypeEnum.BOOK,
        title,
      } as IWorkflow;
      newwf = newwf.concat([newRow]);
      return addPassageTo(WorkflowLevel.Book, newwf, PassageTypeEnum.BOOK);
    };
    const AddAltBook = (newwf: IWorkflow[]) => {
      return addPassageTo(WorkflowLevel.Book, newwf, PassageTypeEnum.ALTBOOK);
    };

    const isKind = (
      row: number,
      kind: PassageTypeEnum,
      wf: IWorkflow[] = workflow
    ) => {
      return row >= 0 && row < wf.length
        ? wf[row].passageType === kind && wf[row].deleted === false
        : false;
    };
    const chapterNumberTitle = (chapter: number) => t.chapter + ' ' + chapter;

    const addChapterNumber = (newwf: IWorkflow[], chapter: number) => {
      const title = chapterNumberTitle(chapter);
      return addPassageTo(
        WorkflowLevel.Section,
        newwf,
        PassageTypeEnum.CHAPTERNUMBER,
        undefined,
        undefined,
        title
      );
    };
    const addTitle = (newwf: IWorkflow[], row: number) => {
      return addPassageTo(WorkflowLevel.Passage, newwf, PassageTypeEnum.TITLE);
    };
    const startChapter = (w: IWorkflow) =>
      (w.passage && w.passage.attributes.startChapter) ??
      getStartChapter(w.reference);

    const chapterChanged = (w: IWorkflow) =>
      w.passageType === PassageTypeEnum.PASSAGE &&
      startChapter(w) !== currentChapter;

    var currentChapter = 0;
    var newworkflow: IWorkflow[] = [];
    if (bookTitleIndex < 0) newworkflow = AddBook(newworkflow);
    if (altBookTitleIndex < 0) newworkflow = AddAltBook(newworkflow);
    var nextpsg = 0;
    workflow.forEach((w, index) => {
      //if flat the title has to come before the section
      //otherwise we want it as the first passage in the section
      if (isSectionRow(w)) {
        nextpsg = 0;

        //copy the section
        //we won't change sequence numbers on hierarchical
        newworkflow = newworkflow.concat([{ ...w }]);
        //do I need a chapter number?
        var vernpsg = workflow.findIndex(
          (r) =>
            !r.deleted &&
            r.passageType === PassageTypeEnum.PASSAGE &&
            r.sectionSeq === w.sectionSeq &&
            r.passageSeq > 0
        );
        if (vernpsg > 0 && chapterChanged(workflow[vernpsg])) {
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
              startChapter(workflow[vernpsg])
            );
            nextpsg += 0.01;
          }
          currentChapter = startChapter(workflow[vernpsg]);
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
        while (workflow[prevrow].deleted) prevrow--;
        if (
          !isSectionRow(workflow[prevrow]) &&
          !w.deleted &&
          chapterChanged(w)
        ) {
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
    setWorkflow(newworkflow);
    setChanged(true);
  };
  const rowinfo = useMemo(() => {
    var totalSections = new Set(
      workflow.filter((w) => !w.deleted).map((w) => w.sectionSeq)
    ).size;
    var regularSections = new Set(
      workflow
        .filter(
          (w) =>
            !w.deleted &&
            w.sectionSeq > 0 &&
            Math.floor(w.sectionSeq) === w.sectionSeq
        )
        .map((w) => w.sectionSeq)
    ).size;
    var filtered = workflow.filter((w) => !w.deleted && !w.filtered);
    var showingSections = new Set(filtered.map((w) => w.sectionSeq)).size;
    if (showingSections < totalSections) {
      local.sectionSeq = (
        <Badge
          badgeContent=" "
          variant="dot"
          color="secondary"
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'left',
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
  }, [workflow]);

  const rowdata = useMemo(
    () => workflowSheet(rowinfo, colNames, workflow),
    [rowinfo, colNames, workflow]
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
        onFilterChange={onFilterChange}
        filterState={filterState}
        maximumSection={workflow[workflow.length - 1]?.sectionSeq ?? 0}
        orgSteps={orgSteps}
        canSetDefault={canSetProjectDefault}
        toolId={toolId}
        onPublishing={onPublishing}
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
        performedBy={speaker}
        onSpeakerChange={handleNameChange}
        ready={isReady}
      />
      {audacityItem?.wf?.passage && (
        <AudacityManager
          item={audacityItem?.index}
          open={Boolean(audacityItem)}
          onClose={handleAudacityClose}
          passageId={
            {
              type: 'passage',
              id: audacityItem?.wf?.passage?.id,
            } as RecordIdentity
          }
          mediaId={audacityItem?.wf?.mediaId?.id || ''}
          onImport={handleAudacityImport}
          speaker={speaker}
          onSpeaker={handleNameChange}
        />
      )}
      <BigDialog
        title={shared ? resStr.resourceEdit : ts.versionHistory}
        isOpen={versionItem !== ''}
        onOpen={handleVerHistClose}
      >
        {shared ? (
          <ResourceTabs passId={versionItem} onOpen={handleVerHistClose} />
        ) : (
          <VersionDlg passId={versionItem} />
        )}
      </BigDialog>
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
  discussions: (q: QueryBuilder) => q.findRecords('discussion'),
  groupmemberships: (q: QueryBuilder) => q.findRecords('groupmembership'),
  workflowSteps: (q: QueryBuilder) => q.findRecords('workflowstep'),
  orgWorkflowSteps: (q: QueryBuilder) => q.findRecords('orgworkflowstep'),
};

export default withData(mapRecordsToProps)(
  connect(mapStateToProps, mapDispatchToProps)(ScriptureTable as any) as any
) as any;
