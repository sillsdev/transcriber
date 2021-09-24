import React, { useState, useEffect, useRef } from 'react';
import { useGlobal } from 'reactn';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
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
} from '../../model';
import localStrings from '../../selector/localize';
import * as actions from '../../store';
import { withData, WithDataProps } from '../../mods/react-orbitjs';
import Memory from '@orbit/memory';
import JSONAPISource from '@orbit/jsonapi';
import { TransformBuilder, RecordIdentity, QueryBuilder } from '@orbit/data';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import { useSnackBar } from '../../hoc/SnackBar';
import PlanSheet, { ICellChange } from './PlanSheet';
import {
  remoteIdNum,
  remoteIdGuid,
  related,
  useOrganizedBy,
  usePlan,
} from '../../crud';
import {
  useRemoteSave,
  lookupBook,
  waitForIt,
  cleanFileName,
  useCheckOnline,
  currentDateTime,
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
} from '.';
import { debounce } from 'lodash';
import AudacityManager from './AudacityManager';
import AssignSection from '../AssignSection';
import StickyRedirect from '../StickyRedirect';
import Auth from '../../auth/Auth';
import Uploader, { IStatus } from '../Uploader';
import { useMediaAttach } from '../../crud/useMediaAttach';
import { UpdateRecord } from '../../model/baseModel';
import { PlanContext } from '../../context/PlanContext';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    container: {
      display: 'flex',
      flexDirection: 'column',
    },
    progress: {
      width: '100%',
    },
    paper: {},
    actions: {
      paddingBottom: 16,
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'flex-end',
    },
    button: {
      margin: theme.spacing(1),
    },
    icon: {
      marginLeft: theme.spacing(1),
    },
  })
);

interface IStateProps {
  t: IScriptureTableStrings;
  s: IPlanSheetStrings;
  ts: ISharedStrings;
  lang: string;
  bookSuggestions: OptionType[];
  bookMap: BookNameMap;
  allBookData: BookName[];
}

interface IDispatchProps {
  fetchBooks: typeof actions.fetchBooks;
  doOrbitError: typeof actions.doOrbitError;
  resetOrbitError: typeof actions.resetOrbitError;
}

interface IRecordProps {
  passages: Array<Passage>;
  sections: Array<Section>;
  mediafiles: Array<MediaFile>;
}

interface IProps
  extends IStateProps,
    IDispatchProps,
    IRecordProps,
    WithDataProps {
  colNames: string[];
  auth: Auth;
}

interface ParamTypes {
  prjId: string;
}

export function ScriptureTable(props: IProps) {
  const {
    t,
    s,
    ts,
    lang,
    colNames,
    bookSuggestions,
    bookMap,
    allBookData,
    fetchBooks,
    doOrbitError,
    resetOrbitError,
    passages,
    sections,
    mediafiles,
    auth,
  } = props;
  const classes = useStyles();
  const { prjId } = useParams<ParamTypes>();
  const [width, setWidth] = React.useState(window.innerWidth);
  const [plan] = useGlobal('plan');
  const [coordinator] = useGlobal('coordinator');
  const memory = coordinator.getSource('memory') as Memory;
  const remote = coordinator.getSource('remote') as JSONAPISource;
  const [user] = useGlobal('user');
  const [doSave] = useGlobal('doSave');
  const [offlineOnly] = useGlobal('offlineOnly');
  const [, setBusy] = useGlobal('importexportBusy');

  const myChangedRef = useRef(false);
  const savingRef = useRef(false);
  const updateRef = useRef(false);
  const [changed, setChangedx] = useGlobal('changed');
  const { showMessage } = useSnackBar();
  const ctx = React.useContext(PlanContext);
  const { flat, scripture } = ctx.state;
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
  const [workflow, setWorkflow] = useState<IWorkflow[]>([]);
  const [, setComplete] = useGlobal('progress');
  const [view, setView] = useState('');
  const [audacityItem, setAudacityItem] = React.useState<IWorkflow>();
  const [lastSaved, setLastSaved] = React.useState<string>();
  const [startSave, saveCompleted, waitForSave] = useRemoteSave();
  const [assignSectionVisible, setAssignSectionVisible] = useState(false);
  const [assignSections, setAssignSections] = useState<number[]>([]);
  const [uploadVisible, setUploadVisible] = useState(false);
  const [recordAudio, setRecordAudio] = useState(true);
  const [importList, setImportList] = useState<File[]>();
  const [status] = useState<IStatus>({ canceled: false });
  const [uploadItem, setUploadItem] = useState<IWorkflow>();
  const [defaultFilename, setDefaultFilename] = useState('');
  const { getPlan } = usePlan();
  const localSave = useWfLocalSave({ setComplete });
  const onlineSave = useWfOnlineSave({ setComplete });
  const [attachPassage, detachPassage] = useMediaAttach({
    ...props,
    ts,
    doOrbitError,
  });
  const checkOnline = useCheckOnline(resetOrbitError);

  const secNumCol = React.useMemo(() => {
    return colNames.indexOf('sectionSeq');
  }, [colNames]);

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
    colNames,
    findBook,
    t,
  });

  const setChanged = (value: boolean) => {
    myChangedRef.current = value;
    setChangedx(value);
  };
  useEffect(() => {
    myChangedRef.current = changed;
  }, [changed]);

  const handleResequence = () => {
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

  const movePassageDown = (data: IWorkflow[], index: number) => {
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

  const addPassageTo = (
    myWorkflow: IWorkflow[],
    i?: number,
    before?: boolean
  ) => {
    const lastRow = myWorkflow.length - 1;
    var index = i === undefined ? lastRow : i;
    let newRow = {
      ...myWorkflow[index],
      kind: flat ? IwfKind.SectionPassage : IwfKind.Passage,
      book: workflow[lastRow]?.book || '',
      reference: '',
      comment: '',
      passageUpdated: currentDateTime(),
      passageId: undefined,
    } as IWorkflow;

    if (
      flat &&
      isSectionRow(myWorkflow[index]) &&
      !isPassageRow(myWorkflow[index])
    ) {
      //no passage on this row yet
      myWorkflow = wfResequencePassages(
        updateRowAt(myWorkflow, newRow, index),
        index
      );
      setWorkflow(myWorkflow);
    } else {
      myWorkflow = insertAt(
        myWorkflow,
        newRow,
        index < lastRow ? index + 1 : undefined
      );
      if (
        before &&
        isSectionRow(myWorkflow[index]) &&
        isPassageRow(myWorkflow[index])
      ) {
        //move passage data from section row to new empty row
        movePassageDown(myWorkflow, index);
      }
      while (!isSectionRow(myWorkflow[index])) index -= 1;
      setWorkflow(wfResequencePassages(myWorkflow, index));
    }
    setChanged(true);
  };

  const addSection = (i?: number) => {
    const sequenceNums = workflow.map((row, j) =>
      !i || j < i ? row.sectionSeq || 0 : 0
    ) as number[];
    const sequencenum = Math.max(...sequenceNums, 0) + 1;
    let newRow = {
      level: flat ? 0 : 1,
      kind: flat ? IwfKind.SectionPassage : IwfKind.Section,
      sectionSeq: sequencenum,
      passageSeq: 0,
      reference: '',
    } as IWorkflow;
    let prevRowIdx = i ? i - 1 : workflow.length - 1;
    if (prevRowIdx >= 0) newRow.book = workflow[prevRowIdx].book;
    let newData = insertAt(workflow, newRow, i);
    //if added in the middle...resequence
    if (i !== undefined) newData = wfResequence(newData);
    addPassageTo(newData, i);
  };

  const addPassage = (i?: number, before?: boolean) => {
    addPassageTo(workflow, i, before);
  };

  const getByIndex = (wf: IWorkflow[], index: number) => {
    let n = 0;
    let i = 0;
    while (n < index && i < wf.length) {
      if (!wf[i].deleted) n += 1;
      i += 1;
    }
    return { wf: i < wf.length ? wf[i] : undefined, i };
  };

  const doDetachMedia = async (wf: IWorkflow | undefined) => {
    if (!wf) return false;
    if (wf.passageId) {
      var attached = mediafiles.filter(
        (m) => related(m, 'passage') === wf.passageId?.id
      );
      for (let ix = 0; ix < attached.length; ix++) {
        var passage = passages.find((p) => p.id === wf.passageId?.id);
        await detachPassage(
          wf.passageId?.id || '',
          related(passage, 'section'),
          plan,
          attached[ix].id
        );
      }
    }
    return true;
  };

  const markDelete = async (index: number) => {
    const { wf, i } = getByIndex(workflow, index);
    if (wf) {
      if (isSectionRow(wf)) {
        let j = i;
        while (j < workflow.length) {
          workflow[j] = { ...workflow[j], deleted: true };
          j += 1;
          if (isSectionRow(workflow[j])) break;
        }
      } else workflow[i] = { ...wf, deleted: true };
      setWorkflow([...workflow]);
      setChanged(true);
    }
  };

  const handleDelete = async (what: string, where: number[]) => {
    if (what === 'Delete') {
      setUploadItem(undefined);
      if (!savingRef.current && !updateRef.current)
        if (changed || myChangedRef.current) {
          startSave();
          setTimeout(() => {}, 1000);
          await markDelete(where[0]);
        } else await markDelete(where[0]);
      return true;
    } else {
      showMessage(<span>{what}...</span>);
      return false;
    }
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
    const { valid, addedWorkflow } = paste(rows);
    if (valid) {
      const newWorkflow = [...workflow].concat(addedWorkflow);
      setWorkflow(newWorkflow);
      setChanged(true);
      return Array<Array<string>>();
    }
    return rows;
  };

  interface MyWorkflow extends IWorkflow {
    [key: string]: any;
  }
  const updateData = (changes: ICellChange[]) => {
    changes.forEach((c) => {
      const { wf, i } = getByIndex(workflow, c.row);
      const myWf = wf as MyWorkflow | undefined;
      const name = colNames[c.col];
      if (myWf && myWf[name] !== c.value) {
        const isSection = c.col < 2;
        const sectionUpdated = isSection
          ? currentDateTime()
          : wf?.sectionUpdated;
        const passageUpdated = isSection
          ? wf?.passageUpdated
          : currentDateTime();
        workflow[i] = {
          ...wf,
          [name]: c.value,
          sectionUpdated,
          passageUpdated,
        } as IWorkflow;
      }
    });
    if (changes.length > 0) {
      setWorkflow([...workflow]);
      setChanged(true);
    }
  };

  const handleTranscribe = (i: number) => {
    const { wf } = getByIndex(workflow, i);
    const id = wf?.passageId?.id || '';
    const passageRemoteId = remoteIdNum('passage', id, memory.keyMap) || id;
    if (changed || myChangedRef.current) {
      startSave();
      waitForSave(() => setView(`/work/${prjId}/${passageRemoteId}`), 100);
    } else setView(`/work/${prjId}/${passageRemoteId}`);
  };

  const handleAudacity = (index: number) => {
    const { wf } = getByIndex(workflow, index);
    if (changed || myChangedRef.current) {
      startSave();
      waitForSave(() => setAudacityItem(wf), 100);
    } else setAudacityItem(wf);
  };

  const handleAudacityClose = () => {
    setAudacityItem(undefined);
  };

  const doAssign = (where: number[]) => {
    setAssignSections(where);
    setAssignSectionVisible(true);
  };
  const handleAssign = (where: number[]) => () => {
    if (changed || myChangedRef.current) {
      startSave();
      waitForSave(() => doAssign(where), 100);
    } else doAssign(where);
  };

  const handleAssignClose = () => () => setAssignSectionVisible(false);

  const setFilename = (wf: IWorkflow | undefined) => {
    if (wf?.passageId?.id) {
      var passageRec = memory.cache.query((q) =>
        q.findRecord(wf.passageId as RecordIdentity)
      ) as Passage;
      setDefaultFilename(
        cleanFileName(
          (passageRec.attributes.book || '') + passageRec.attributes.reference
        )
      );
    }
  };

  const showUpload = (i: number, record: boolean) => {
    const { wf } = getByIndex(workflow, i);
    setFilename(wf);
    setUploadItem(wf);
    setRecordAudio(record);
    setUploadVisible(true);
  };

  const handleUploadVisible = (v: boolean) => {
    setUploadVisible(v);
  };

  const handleUpload = (i: number) => () => {
    if (changed || myChangedRef.current) {
      startSave();
      waitForSave(() => showUpload(i, false), 100);
    } else showUpload(i, false);
  };

  const handleAudacityImport = (i: number, list: File[]) => {
    setImportList(list);
    showUpload(i, false);
  };

  const handleRecord = (i: number) => {
    const { wf } = getByIndex(workflow, i);
    if (wf?.sectionId?.id) {
      startSave();
      waitForSave(() => showUpload(i, true), 100);
    } else showUpload(i, true);
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
        for (; start + 200 < numChanges; start += 200) {
          setComplete(Math.floor((90 * start) / numChanges) + 10);
          change = (await saveFn(workflow.slice(start, start + 200))) || change;
        }
      }
      change = (await saveFn(workflow.slice(start))) || change;
      //update plan section count and lastmodified
      await updateLastModified();
      if (change) setWorkflow([...workflow]);
      setBusy(false);
    };
    const setSaving = (value: boolean) => (savingRef.current = value);
    const save = () => {
      if (!savingRef.current && !updateRef.current) {
        setSaving(true);
        setChanged(false);
        prevSave = lastSaved || '';
        setLastSaved(currentDateTime());
        showMessage(t.saving);
        handleSave().then(() => {
          saveCompleted('');
          setSaving(false);
        });
      }
    };
    if (doSave) {
      if (offlineOnly) {
        save();
      } else {
        checkOnline((online) => {
          if (!online) {
            saveCompleted(ts.NoSaveOffline);
            showMessage(ts.NoSaveOffline);
            setSaving(false);
          } else {
            save();
          }
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doSave]);

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
      const newWorkflow = getWorkflow(plan, sections, passages, flat, memory);
      setWorkflow(newWorkflow);
      getLastModified(plan);
      setUpdate(false);
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [plan, sections, passages, flat]);

  // Reset column widths based on sheet content
  useEffect(() => {
    const curNames = colNames.concat(['action']);
    const local = {
      sectionSeq: organizedBy,
      title: t.title,
      passageSeq: t.passage,
      book: t.book,
      reference: t.reference,
      comment: t.description,
      action: t.action,
    };
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
    if (change) {
      setColumns(colHead);
      setSaveColAdd(colAdd);
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [workflow, width, colNames, flat]);

  if (view !== '') return <StickyRedirect to={view} />;

  const afterUpload = async (planId: string, mediaRemoteIds?: string[]) => {
    if (
      mediaRemoteIds &&
      mediaRemoteIds.length > 0 &&
      uploadItem !== undefined
    ) {
      const passId = uploadItem?.passageId?.id || '';
      await attachPassage(
        passId,
        related(
          passages.find((p) => p.id === passId),
          'section'
        ),
        plan,
        remoteIdGuid('mediafile', mediaRemoteIds[0], memory.keyMap) ||
          mediaRemoteIds[0]
      );
    }
    setUploadItem(undefined);
    if (importList) {
      setImportList(undefined);
      setUploadVisible(false);
    }
  };

  const handleLookupBook = (book: string) =>
    lookupBook({ book, allBookData, bookMap });

  return (
    <div className={classes.container}>
      <PlanSheet
        {...props}
        columns={columns}
        rowData={workflowSheet(workflow, colNames)}
        rowInfo={workflow.filter((w) => !w.deleted)}
        bookCol={colNames.findIndex((v) => v === 'book')}
        bookMap={bookMap}
        bookSuggestions={bookSuggestions}
        action={handleDelete}
        addSection={addSection}
        addPassage={addPassage}
        updateData={updateData}
        paste={handleTablePaste}
        lookupBook={handleLookupBook}
        resequence={handleResequence}
        inlinePassages={flat}
        onTranscribe={handleTranscribe}
        onAudacity={handleAudacity}
        onAssign={handleAssign}
        onUpload={handleUpload}
        onRecord={handleRecord}
        lastSaved={lastSaved}
        auth={auth}
        t={s}
        ts={ts}
      />
      <AssignSection
        sections={getSectionsWhere(assignSections)}
        visible={assignSectionVisible}
        closeMethod={handleAssignClose()}
      />
      <Uploader
        recordAudio={recordAudio}
        defaultFilename={defaultFilename}
        auth={auth}
        mediaId={uploadItem?.mediaId?.id || ''}
        importList={importList}
        isOpen={uploadVisible}
        onOpen={handleUploadVisible}
        showMessage={showMessage}
        setComplete={setComplete}
        multiple={false}
        finish={afterUpload}
        status={status}
      />
      {audacityItem?.passageId && (
        <AudacityManager
          item={audacityItem}
          open={Boolean(audacityItem)}
          onClose={handleAudacityClose}
          passageId={audacityItem?.passageId as RecordIdentity}
          mediaId={audacityItem?.mediaId || ''}
          onImport={handleAudacityImport}
        />
      )}
    </div>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'scriptureTable' }),
  s: localStrings(state, { layout: 'planSheet' }),
  ts: localStrings(state, { layout: 'shared' }),
  lang: state.strings.lang,
  bookSuggestions: state.books.suggestions,
  bookMap: state.books.map,
  allBookData: state.books.bookData,
});

const mapDispatchToProps = (dispatch: any): IDispatchProps => ({
  ...bindActionCreators(
    {
      fetchBooks: actions.fetchBooks,
      doOrbitError: actions.doOrbitError,
      resetOrbitError: actions.resetOrbitError,
    },
    dispatch
  ),
});

const mapRecordsToProps = {
  passages: (q: QueryBuilder) => q.findRecords('passage'),
  sections: (q: QueryBuilder) => q.findRecords('section'),
  mediafiles: (q: QueryBuilder) => q.findRecords('mediafile'),
};

export default withData(mapRecordsToProps)(
  connect(mapStateToProps, mapDispatchToProps)(ScriptureTable) as any
) as any;
