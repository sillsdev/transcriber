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
  SectionPassage,
  ISharedStrings,
  MediaFile,
  OptionType,
  ActivityStates,
  Plan,
} from '../model';
import localStrings from '../selector/localize';
import * as actions from '../store';
import { withData, WithDataProps } from '../mods/react-orbitjs';
import Memory from '@orbit/memory';
import JSONAPISource from '@orbit/jsonapi';
import {
  TransformBuilder,
  RecordIdentity,
  QueryBuilder,
  Operation,
} from '@orbit/data';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import { useSnackBar } from '../hoc/SnackBar';
import PlanSheet from './PlanSheet';
import {
  remoteId,
  remoteIdNum,
  remoteIdGuid,
  related,
  getMediaRec,
  useOrganizedBy,
  usePlan,
  UpdatePassageStateOps,
} from '../crud';
import {
  Online,
  useRemoteSave,
  lookupBook,
  waitForIt,
  cleanFileName,
} from '../utils';
import { debounce } from 'lodash';
import AudacityManager from './AudacityManager';
import AssignSection from './AssignSection';
import StickyRedirect from './StickyRedirect';
import Auth from '../auth/Auth';
import Uploader, { IStatus } from './Uploader';
import { useMediaAttach } from '../crud/useMediaAttach';
import { keyMap } from '../schema';
import { AddRecord, UpdateRecord } from '../model/baseModel';

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

interface ISequencedRecordIdentity extends RecordIdentity {
  sequencenum: number;
}
interface IRecord {
  id: string;
  issection: boolean;
  changed: boolean;
  sequencenum: string;
  book: string;
  reference: string;
  title: string;
}
interface ICols {
  SectionSeq: number;
  SectionnName: number;
  PassageSeq: number;
  Book: number;
  Reference: number;
  Title: number;
}

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
  cols: ICols;
  auth: Auth;
}
export interface IRowInfo {
  sectionId?: ISequencedRecordIdentity;
  passageId?: ISequencedRecordIdentity;
  transcriber?: string;
  editor?: string;
  mediaId: string;
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
    cols,
    bookSuggestions,
    bookMap,
    allBookData,
    fetchBooks,
    doOrbitError,
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
  const [, setConnected] = useGlobal('connected');

  const myChangedRef = useRef(false);
  const savingRef = useRef(false);
  const updateRef = useRef(false);
  const [changed, setChangedx] = useGlobal('changed');
  const { showMessage } = useSnackBar();
  const [rowInfo, setRowInfo] = useState(Array<IRowInfo>());
  const inlinePassages = useRef(false);
  const { getOrganizedBy } = useOrganizedBy();
  const [organizedBy] = useState<string>(getOrganizedBy(true));
  const [columns, setColumns] = useState([
    { value: organizedBy, readOnly: true, width: 80 },
    { value: t.title, readOnly: true, width: 280 },
    { value: t.passage, readOnly: true, width: 80 },
    { value: t.reference, readOnly: true, width: 180 },
    { value: t.description, readOnly: true, width: 280 },
  ]);
  const [data, setData] = useState(Array<Array<any>>());
  const [inData, setInData] = useState(Array<Array<any>>());
  const [, setComplete] = useGlobal('progress');
  const [view, setView] = useState('');
  const [audacityItem, setAudacityItem] = React.useState(0);
  const [audacityOpen, setAudacityOpen] = React.useState(false);
  const [lastSaved, setLastSaved] = React.useState<string>();
  const [startSave, saveCompleted, waitForSave] = useRemoteSave();
  const [assignSectionVisible, setAssignSectionVisible] = useState(false);
  const [assignSections, setAssignSections] = useState<number[]>([]);
  const [uploadVisible, setUploadVisible] = useState(false);
  const [recordAudio, setRecordAudio] = useState(true);
  const [importList, setImportList] = useState<File[]>();
  const [status] = useState<IStatus>({ canceled: false });
  const uploadRow = useRef<number>();
  const [defaultFilename, setDefaultFilename] = useState('');
  const showBook = (cols: ICols) => cols.Book >= 0;
  const { getPlan } = usePlan();
  const [attachPassage, detachPassage] = useMediaAttach({
    ...props,
    ts,
    doOrbitError,
  });

  const newSectionId = (sequenceNum: number) => {
    return {
      type: 'section',
      id: '',
      sequencenum: sequenceNum,
    };
  };

  const newPassageId = (sequenceNum: number) => {
    return {
      type: 'passage',
      id: '',
      sequencenum: sequenceNum,
    };
  };

  const setChanged = (value: boolean) => {
    myChangedRef.current = value;
    setChangedx(value);
  };
  useEffect(() => {
    myChangedRef.current = changed;
  }, [changed]);

  const isSectionRow = (row: IRowInfo) => row.sectionId !== undefined;

  const isPassageRow = (row: IRowInfo) => row.passageId !== undefined;

  const sectionId = (row: number) =>
    row < rowInfo.length ? rowInfo[row].sectionId?.id || '' : '';

  const passageId = (row: number) =>
    row < rowInfo.length ? rowInfo[row].passageId?.id || '' : '';

  const resequencePassages = (data: any[][], sectionIndex: number) => {
    let pas = 1;
    let change = false;
    for (
      let i = sectionIndex;
      i < data.length &&
      (i === sectionIndex || !isValidNumber(data[i][cols.SectionSeq]));
      i += 1
    ) {
      let r = data[i];
      if (isValidNumber(r[cols.PassageSeq])) {
        if (r[cols.PassageSeq] !== pas) {
          change = true;
          r[cols.PassageSeq] = pas;
          data[i] = [...r];
        }
        pas += 1;
      }
    }
    if (change) setChanged(true);
    return change ? [...data] : data;
  };

  const resequence = (data: any[][], sec = 1) => {
    let change = false;
    let pas = 1;
    for (let i = 0; i < data.length; i += 1) {
      let r = data[i];
      if (isValidNumber(r[cols.SectionSeq])) {
        if (r[cols.SectionSeq] !== sec) {
          change = true;
          r[cols.SectionSeq] = sec;
          data[i] = [...r];
        }
        sec += 1;
        pas = 1;
      }
      if (isValidNumber(r[cols.PassageSeq])) {
        if (r[cols.PassageSeq] !== pas) {
          change = true;
          r[cols.PassageSeq] = pas;
          data[i] = [...r];
        }
        pas += 1;
      }
    }
    if (change) setChanged(true);
    else if (!data.length) {
      //all rows deleted
      setChanged(false);
    }

    return change ? [...data] : data;
  };

  const handleResequence = () => {
    setData(resequence(data));
  };

  const insertAt = (arr: Array<any>, item: any, index?: number) => {
    const d2 = Array.isArray(item);
    if (index === undefined) {
      return [...arr.concat([item])];
    } else {
      const newArr = arr.map((v, i) =>
        i < index
          ? d2
            ? [...v]
            : v
          : i === index
          ? item
          : d2
          ? [...arr[i - 1]]
          : arr[i - 1]
      );
      const lastIndex = arr.length - 1;
      return [...newArr.concat([d2 ? [...arr[lastIndex]] : arr[lastIndex]])];
    }
  };

  const updateRowAt = (arr: Array<any>, item: any, index: number) => {
    const d2 = Array.isArray(item);
    const newArr = arr.map((v, i) =>
      i < index
        ? d2
          ? [...v]
          : v
        : i === index
        ? item
        : d2
        ? [...arr[i]]
        : arr[i]
    );
    return newArr;
  };

  const addSection = (i?: number) => {
    const sequenceNums = data.map((row, j) =>
      !i || j < i ? row[cols.SectionSeq] || 0 : 0
    ) as number[];
    const sequencenum = Math.max(...sequenceNums, 0) + 1;
    let newRow;
    if (showBook(cols)) {
      newRow = [sequencenum, '', '', '', '', ''];
      var prevRow = i ? i - 1 : data.length - 1;
      if (prevRow >= 0) newRow[cols.Book] = data[prevRow][cols.Book];
    } else {
      newRow = [sequencenum, '', '', '', ''];
    }
    var newData = insertAt(data, newRow, i);
    //if added in the middle...resequence
    if (i !== undefined) newData = resequence(newData);
    addPassageTo(
      newData,
      insertAt(inData, newRow, i),
      insertAt(
        rowInfo,
        { sectionId: newSectionId(sequencenum) } as IRowInfo,
        i
      ),
      i,
      true
    );
  };
  const addPassage = (i?: number, before?: boolean) => {
    addPassageTo(data, inData, rowInfo, i, before);
  };
  const addPassageTo = (
    myData: any[][] /* may or may not already be a copy */,
    myIndata: any[][],
    //newRowId: ISequencedRecordIdentity[][],
    myRowInfo: IRowInfo[],
    i?: number,
    before?: boolean
  ) => {
    const lastRow = myData.length - 1;
    var index = i === undefined ? lastRow : i;

    let newRow;
    if (showBook(cols)) {
      const book = myData[lastRow][cols.Book] || '';
      newRow = ['', '', 0, book, '', ''];
    } else {
      newRow = ['', '', 0, '', ''];
    }
    if (
      inlinePassages.current &&
      isSectionRow(myRowInfo[index]) &&
      !isPassageRow(myRowInfo[index])
    ) {
      //no passage on this row yet
      newRow[cols.SectionSeq] = myData[index][cols.SectionSeq];
      newRow[cols.SectionnName] = myData[index][cols.SectionnName];
      myData = resequencePassages(updateRowAt(myData, newRow, index), index);
      setData(myData);
      newRow[cols.SectionSeq] = myIndata[index][cols.SectionSeq];
      newRow[cols.SectionnName] = myIndata[index][cols.SectionnName];
      setInData(updateRowAt(myIndata, newRow, index));

      var rowinfo = { ...myRowInfo[index] };
      rowinfo.passageId = newPassageId(
        myData[index][cols.PassageSeq] as number
      );
      rowinfo.mediaId = '';
      myRowInfo[index] = rowinfo;
      setRowInfo([...myRowInfo]);
    } else {
      myData = insertAt(
        myData,
        newRow,
        index < lastRow ? index + 1 : undefined
      );
      myIndata = insertAt(
        myIndata,
        newRow,
        index < lastRow ? index + 1 : undefined
      );
      myRowInfo = insertAt(
        myRowInfo,
        { passageId: newPassageId(0), mediaId: '' },
        index < lastRow ? index + 1 : undefined
      );
      if (
        before &&
        isSectionRow(myRowInfo[index]) &&
        isPassageRow(myRowInfo[index])
      ) {
        //move passage data from section row to new empty row
        movePassageDown(myData, index);
        movePassageDown(myIndata, index);
        //swap rowIds
        rowinfo = { ...myRowInfo[index] };
        var newrowinfo = { ...myRowInfo[index + 1] };
        newrowinfo.passageId = rowinfo.passageId;
        rowinfo.passageId = newPassageId(0);
        myRowInfo[index] = rowinfo;
        myRowInfo[index + 1] = newrowinfo;
      }
      while (!isSectionRow(myRowInfo[index])) index -= 1;
      setData(resequencePassages(myData, index));
      setInData([...myIndata]);
      setRowInfo([...myRowInfo]);
    }

    setChanged(true);
  };
  const movePassageDown = (rowdata: any[][], index: number) => {
    var origrowid = [...rowdata[index]];
    var newrowid = [...rowdata[index + 1]];

    if (cols.Book > 0) {
      newrowid[cols.Book] = origrowid[cols.Book];
    }
    newrowid[cols.Reference] = origrowid[cols.Reference];
    origrowid[cols.Reference] = '';
    newrowid[cols.Title] = origrowid[cols.Title];
    origrowid[cols.Title] = '';
    rowdata[index] = origrowid;
    rowdata[index + 1] = newrowid;
  };

  const handleDelete = async (what: string, where: number[]) => {
    if (what === 'Delete') {
      uploadRow.current = undefined;
      if (changed || myChangedRef.current) {
        startSave();
        waitForSave(async () => await doDelete(where), 100);
      } else await doDelete(where);
      return true;
    } else {
      showMessage(<span>{what}...</span>);
      return false;
    }
  };
  const doDelete = async (where: number[]) => {
    let modified = false;
    const deleteOrbitRow = async (id: RecordIdentity | undefined) => {
      if (id && id.id !== '') {
        await memory.update((t: TransformBuilder) => t.removeRecord(id));
        modified = true;
      }
    };
    //work from the bottom up so we can detach/delete passages before the section
    for (
      let rowListIndex = where.length - 1;
      rowListIndex >= 0;
      rowListIndex -= 1
    ) {
      const rowIndex = where[rowListIndex];
      if (rowInfo[rowIndex].passageId) {
        var attached = mediafiles.filter(
          (m) => related(m, 'passage') === rowInfo[rowIndex].passageId?.id
        );
        for (let ix = 0; ix < attached.length; ix++) {
          var passage = passages.find(
            (p) => p.id === rowInfo[rowIndex].passageId?.id
          );
          await detachPassage(
            rowInfo[rowIndex].passageId?.id || '',
            related(passage, 'section'),
            plan,
            attached[ix].id
          );
        }
        await deleteOrbitRow(rowInfo[rowIndex].passageId as RecordIdentity);
      }
      await deleteOrbitRow(rowInfo[rowIndex].sectionId as RecordIdentity);
    }
    if (modified) updateLastModified();
    setData(
      resequence(data.filter((row, rowIndex) => !where.includes(rowIndex)))
    );
    setRowInfo(rowInfo.filter((row, rowIndex) => !where.includes(rowIndex)));
    setInData(inData.filter((row, rowIndex) => !where.includes(rowIndex)));
    if (myChangedRef.current) startSave(); //resequenced and for some reason the deletes stay disabled until saved.  Can't track down why right now so just save it.
    return true;
  };

  const getSectionsWhere = (where: number[]) => {
    let selected = Array<Section>();
    let one: any;
    where.forEach((c) => {
      one = sections.find((s) => s.id === sectionId(c));
      if (one) selected.push(one);
    });
    return selected;
  };

  const validTable = (rows: string[][]) => {
    if (rows.length === 0) {
      showMessage(t.pasteNoRows);
      return false;
    }
    if (showBook(cols)) {
      if (rows[0].length !== 6) {
        showMessage(
          t.pasteInvalidColumnsScripture.replace(
            '{0}',
            rows[0].length.toString()
          )
        );
        return false;
      }
    } else {
      if (rows[0].length !== 5) {
        showMessage(
          t.pasteInvalidColumnsGeneral.replace('{0}', rows[0].length.toString())
        );
        return false;
      }
    }
    let invalidSec = rows
      .filter(
        (row, rowIndex) =>
          rowIndex > 0 && !isBlankOrValidNumber(row[cols.SectionSeq])
      )
      .map((row) => row[cols.SectionSeq]);
    if (invalidSec.length > 0) {
      showMessage(
        <span>
          {t.pasteInvalidSections} {invalidSec.join()}
        </span>
      );
      return false;
    }
    let invalidPas = rows
      .filter(
        (row, rowIndex) =>
          rowIndex > 0 && !isBlankOrValidNumber(row[cols.PassageSeq])
      )
      .map((row) => row[cols.PassageSeq]);
    if (invalidPas.length > 0) {
      showMessage(
        <span>
          {t.pasteInvalidSections} {invalidPas.join()}.
        </span>
      );
      return false;
    }
    return true;
  };

  const isBlankOrValidNumber = (value: string): boolean => {
    return /^[0-9]*$/.test(value);
  };

  const isValidNumber = (value: string): boolean => {
    return /^[0-9]+$/.test(value);
  };

  const splitSectionPassage = (
    value: string[],
    index: number,
    array: string[][]
  ): void => {
    if (
      isValidNumber(value[cols.SectionSeq]) &&
      isValidNumber(value[cols.PassageSeq])
    ) {
      let cp = [...value];
      cp[cols.PassageSeq] = '';
      value[cols.SectionSeq] = '';
      array.splice(index, 0, cp); //copy the row -- the copy goes in before
    }
  };

  // const getTotalSections = (total: number, row: string[]) => {
  //   return total + (isValidNumber(row[cols.SectionSeq]) ? 1 : 0);
  // };

  const handleTablePaste = (rows: string[][]) => {
    if (validTable(rows)) {
      const startRow = isBlankOrValidNumber(rows[0][cols.SectionSeq]) ? 0 : 1;
      if (!inlinePassages.current) {
        while (
          rows.find(function (value: string[]) {
            return (
              isValidNumber(value[cols.SectionSeq]) &&
              isValidNumber(value[cols.PassageSeq])
            );
          }) !== undefined
        ) {
          rows.forEach(splitSectionPassage);
        }
      }
      // const secCount = data.reduce(getTotalSections, 1);
      // rows = resequence(rows, secCount);
      /* Make it clear which columns can be imported by blanking others */
      setData([
        ...data.concat(
          rows
            .filter((row, rowIndex) => rowIndex >= startRow)
            .map((row) =>
              row.map((col, colIndex) =>
                isValidNumber(row[cols.PassageSeq]) && colIndex === cols.Book
                  ? lookupBook({ book: col, allBookData, bookMap })
                  : isValidNumber(row[cols.SectionSeq])
                  ? (inlinePassages.current &&
                      isValidNumber(row[cols.PassageSeq]) &&
                      parseInt(row[cols.PassageSeq]) === 1) ||
                    colIndex < cols.PassageSeq
                    ? col
                    : ''
                  : colIndex >= cols.PassageSeq //not a section row
                  ? col
                  : ''
              )
            )
        ),
      ]);
      setInData([
        ...inData.concat(
          rows
            .filter((row, rowIndex) => rowIndex >= startRow)
            .map((row) =>
              row.map((col, colIndex) =>
                colIndex !== cols.Book
                  ? col
                  : lookupBook({ book: col, allBookData, bookMap })
              )
            )
        ),
      ]);
      setRowInfo([
        ...rowInfo.concat(
          rows
            .filter((row, rowIndex) => rowIndex >= startRow)
            .map((row) => {
              if (isValidNumber(row[cols.SectionSeq])) {
                var newid = {
                  sectionId: newSectionId(parseInt(row[cols.SectionSeq])),
                  mediaId: '',
                } as IRowInfo;
                if (
                  inlinePassages.current &&
                  isValidNumber(row[cols.PassageSeq])
                )
                  newid.passageId = newPassageId(
                    parseInt(row[cols.PassageSeq])
                  );
                return newid;
              } else {
                return {
                  passageId: newPassageId(parseInt(row[cols.PassageSeq])),
                  mediaId: '',
                } as IRowInfo;
              }
            })
        ),
      ]);
      setChanged(true);
      return Array<Array<string>>();
    }
    return rows;
  };

  const updateData = (rows: string[][]) => {
    setData(rows);
  };

  function generateUUID() {
    // Public Domain/MIT
    var d = new Date().getTime(); //Timestamp
    var d2 = (performance && performance.now && performance.now() * 1000) || 0; //Time in microseconds since page-load or 0 if unsupported
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
      /[xy]/g,
      function (c) {
        var r = Math.random() * 16; //random number between 0 and 16
        if (d > 0) {
          //Use timestamp until depleted
          r = (d + r) % 16 | 0;
          d = Math.floor(d / 16);
        } else {
          //Use microseconds since page-load if supported
          r = (d2 + r) % 16 | 0;
          d2 = Math.floor(d2 / 16);
        }
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
      }
    );
  }

  const setDimensions = () => {
    setWidth(window.innerWidth);
  };

  const handleTranscribe = (i: number) => {
    const id = passageId(i);
    const passageRemoteId = remoteIdNum('passage', id, memory.keyMap) || id;
    if (changed || myChangedRef.current) {
      startSave();
      waitForSave(() => setView(`/work/${prjId}/${passageRemoteId}`), 100);
    } else setView(`/work/${prjId}/${passageRemoteId}`);
  };

  const handleAudacity = (i: number) => {
    setAudacityItem(i);
    if (changed || myChangedRef.current) {
      startSave();
      waitForSave(() => setAudacityOpen(true), 100);
    } else setAudacityOpen(true);
  };

  const handleAudacityClose = () => {
    setAudacityOpen(false);
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

  const setFilename = (row: number) => {
    if (passageId(row)) {
      var passageRec = memory.cache.query((q) =>
        q.findRecord({
          type: 'passage',
          id: passageId(row),
        })
      ) as Passage;
      setDefaultFilename(
        cleanFileName(
          (passageRec.attributes.book || '') + passageRec.attributes.reference
        )
      );
    }
  };
  const showUpload = (i: number, record: boolean) => {
    setFilename(i);
    uploadRow.current = i;
    setRecordAudio(record);
    setUploadVisible(true);
  };
  const handleUploadVisible = (v: boolean) => {
    setUploadVisible(v);
  };
  const handleUpload = (i: number) => () => {
    if (passageId(i) === '') {
      startSave();
      waitForSave(() => showUpload(i, false), 100);
    } else showUpload(i, false);
  };
  const handleAudacityImport = (i: number, list: File[]) => {
    setImportList(list);
    showUpload(i, false);
  };
  const handleRecord = (i: number) => {
    if (passageId(i) === '') {
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
      setLastSaved(planRec.attributes.dateUpdated);
    }
  };

  const getLastModified = (plan: string) => {
    if (plan) {
      var planRec = getPlan(plan);
      if (planRec !== null) setLastSaved(planRec.attributes.dateUpdated);
      else setLastSaved('');
    }
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

  const getRemoteId = async (table: string, localid: string) => {
    await waitForIt(
      'remoteId',
      () => remoteId(table, localid, memory.keyMap) !== undefined,
      () => false,
      100
    );
    return remoteId(table, localid, memory.keyMap);
  };
  const getChangedRecs = async (changedRows: boolean[]) => {
    let recs: IRecord[][] = [];
    for (var index = 0; index < rowInfo.length; index++) {
      var row = rowInfo[index];
      var rec = [];
      if (isSectionRow(row)) {
        var id = row.sectionId?.id || '';
        rec.push({
          issection: true,
          id: id,
          changed: changedRows[index],
          sequencenum: data[index][cols.SectionSeq],
          book: showBook(cols) ? data[index][cols.Book] : '',
          reference: data[index][cols.Reference],
          title: data[index][cols.SectionnName],
        });
      }
      if (isPassageRow(row)) {
        if (changedRows[index]) {
          id = row.passageId?.id || '';
          rec.push({
            issection: false,
            id: id,
            changed: true,
            sequencenum: data[index][cols.PassageSeq],
            book: showBook(cols) ? data[index][cols.Book] : '',
            reference: data[index][cols.Reference],
            title: data[index][cols.Title],
          });
        }
        //don't bother to push all the passage if not changed
        else
          rec.push({
            issection: false,
            changed: false,
          } as IRecord);
      }
      recs.push(rec);
    }
    return recs;
  };

  const onlineSaveFn = async (recs: IRecord[][], anyNew: boolean) => {
    for (let ix = 0; ix < recs.length; ix++) {
      let rec = recs[ix];
      if ((rec[0].id || '') !== '')
        rec[0].id = await getRemoteId(
          rec[0].issection ? 'section' : 'passage',
          rec[0].id
        );
      if (rec.length > 1 && (rec[1].id || '') !== '')
        rec[1].id = await getRemoteId('passage', rec[1].id);
    }
    const sp: SectionPassage = {
      attributes: {
        data: JSON.stringify(recs),
        planId: remoteIdNum('plan', plan, memory.keyMap),
        uuid: generateUUID(),
      },
      type: 'sectionpassage',
    } as SectionPassage;
    memory.schema.initializeRecord(sp);
    setComplete(20);
    var dumbrec = await memory.update(
      (t: TransformBuilder) => t.addRecord(sp),
      {
        label: 'Update Plan Section and Passages',
        sources: {
          remote: {
            settings: {
              timeout: 2000000,
            },
          },
        },
      }
    );
    //null only if sent twice by orbit
    if (dumbrec) {
      setComplete(50);
      //dumbrec does not contain the new data...just the new id so go get it
      var filterrec = {
        attribute: 'plan-id',
        value: remoteId('plan', plan, memory.keyMap),
      };
      //must wait for these...in case they they navigate away before done
      await memory.sync(
        await remote.pull((q) => q.findRecords('section').filter(filterrec))
      );
      await memory.sync(
        await remote.pull((q) => q.findRecords('passage').filter(filterrec))
      );
      await memory.sync(
        await remote.pull((q) => q.findRecord({ type: 'plan', id: plan }))
      );
      if (anyNew) {
        var rec: SectionPassage = (await remote.query((q: QueryBuilder) =>
          q.findRecord({ type: 'sectionpassage', id: dumbrec.id })
        )) as any;
        if (rec !== undefined) {
          //outrecs is an array of arrays of IRecords
          var outrecs = JSON.parse(rec.attributes.data);
          var newrowinfo = rowInfo.map((r) => {
            return { ...r };
          }); // _.cloneDeep(r));

          newrowinfo.forEach((row, index) => {
            if (isSectionRow(row) && row.sectionId?.id === '')
              row.sectionId.id = remoteIdGuid(
                'section',
                (outrecs[index][0] as IRecord).id,
                memory.keyMap
              );
            if (isPassageRow(row) && row.passageId?.id === '')
              row.passageId.id = remoteIdGuid(
                'passage',
                (outrecs[index][isSectionRow(row) ? 1 : 0] as IRecord).id,
                memory.keyMap
              );
          });
          setRowInfo(newrowinfo);
          setInData(data.map((row: Array<any>) => [...row]));
        }
      }
    }
  };
  const updateSection = async (sec: Section) => {
    await memory.update((t: TransformBuilder) => UpdateRecord(t, sec, user));
  };
  const localSaveFn = async (recs: IRecord[][]) => {
    let lastSec: Section = { id: 'never here' } as Section;
    const numRecs = recs.length;
    for (let rIdx = 0; rIdx < numRecs; rIdx += 1) {
      if (rIdx % 20 === 0) {
        //this is slow...so find a happy medium between info and speed
        setComplete(((rIdx / numRecs) * 100) | 0);
      }
      const table = recs[rIdx];
      for (let tIdx = 0; tIdx < table.length; tIdx += 1) {
        const item = table[tIdx];
        if (item.issection) {
          if (item.id !== '') {
            lastSec = sections.filter((s) => s.id === item.id)[0];
            //might have been the passage that changed if flat
            if (
              item.changed &&
              (lastSec.attributes.sequencenum !== parseInt(item.sequencenum) ||
                lastSec.attributes.name !== item.title)
            ) {
              const secRec = {
                ...lastSec,
                attributes: {
                  ...lastSec.attributes,
                  sequencenum: parseInt(item.sequencenum),
                  name: item.title,
                },
              };
              await updateSection(secRec);
              lastSec = secRec;
            }
          } else {
            const newRec = {
              type: 'section',
              attributes: {
                sequencenum: parseInt(item.sequencenum),
                name: item.title,
                state: ActivityStates.NoMedia,
              },
            } as any;
            const planRecId = { type: 'plan', id: plan };
            await memory.update((t: TransformBuilder) => [
              ...AddRecord(t, newRec, user, memory),
              t.replaceRelatedRecord(newRec, 'plan', planRecId),
            ]);
            lastSec = newRec;
          }
        } else if (item.changed) {
          //passage
          if (item.id !== '') {
            const passRecs = passages.filter((p) => p.id === item.id);
            await memory.update((t: TransformBuilder) =>
              UpdateRecord(
                t,
                {
                  ...passRecs[0],
                  attributes: {
                    ...passRecs[0].attributes,
                    sequencenum: parseInt(item.sequencenum),
                    book: item.book,
                    reference: item.reference,
                    title: item.title,
                  },
                } as Passage,
                user
              )
            );
          } else {
            const passRec: Passage = {
              type: 'passage',
              attributes: {
                sequencenum: parseInt(item.sequencenum),
                book: item.book,
                reference: item.reference,
                title: item.title,
                state: ActivityStates.NoMedia,
              },
            } as any;
            const secRecId = { type: 'section', id: lastSec.id };
            const t = new TransformBuilder();
            const ops: Operation[] = [
              ...AddRecord(t, passRec, user, memory),
              t.replaceRelatedRecord(passRec, 'section', secRecId),
            ];
            UpdatePassageStateOps(
              passRec.id,
              lastSec.id,
              plan,
              ActivityStates.NoMedia,
              '',
              user,
              t,
              ops,
              memory
            );
            await memory.update(ops);
          }
          //update section last modified
          //TT-2469 this causes any new passages to forget about their section
          //await updateSection(lastSec);
        }
      }
    }
    //update plan section count and lastmodified
    await updateLastModified();
  };

  useEffect(() => {
    const handleSave = async () => {
      const saveFn = async (changedRows: boolean[], anyNew: boolean) => {
        setComplete(10);
        const recs = await getChangedRecs(changedRows);
        let numChanges = changedRows.filter((r) => r).length;
        if (!offlineOnly && numChanges > 10) await onlineSaveFn(recs, anyNew);
        else await localSaveFn(recs);
      };
      let changedRows: boolean[] = rowInfo.map(
        (row) => row.sectionId?.id === '' || row.passageId?.id === ''
      );
      const anyNew = changedRows.includes(true);
      changedRows.forEach((row, index) => {
        if (!row) {
          //if not new, see if altered
          for (let i = 0; i < inData[index].length; i++) {
            if (inData[index][i] !== data[index][i]) {
              changedRows[index] = true;
              break;
            }
          }
        }
      });
      let numChanges = changedRows.filter((r) => r).length;
      if (numChanges === 0) {
        return;
      }
      if (numChanges > 50) setBusy(true);
      if (!offlineOnly) {
        while (numChanges > 200) {
          let someChangedRows = [...changedRows];
          let count = 0;
          someChangedRows.forEach((row, index) => {
            if (count <= 200) {
              if (row) {
                count++;
                changedRows[index] = false;
              }
            } else someChangedRows[index] = false;
          });
          await saveFn(someChangedRows, anyNew);
          numChanges = changedRows.filter((r) => r).length;
        }
      }
      await saveFn(changedRows, anyNew);
      setBusy(false);
    };
    const setSaving = (value: boolean) => (savingRef.current = value);
    const save = () => {
      if (!savingRef.current && !updateRef.current) {
        setSaving(true);
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
        Online((online) => {
          setConnected(online);
          if (!online) {
            saveCompleted(ts.NoSaveOffline);
            showMessage(ts.NoSaveOffline);
            setSaving(false);
          } else {
            save();
          }
        }, auth);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doSave, data, inData, rowInfo]);

  useEffect(() => {
    if (plan !== '') {
      const getFlat = () => {
        var planRec = getPlan(plan);
        if (planRec !== null) return planRec.attributes?.flat;
        return false;
      };

      inlinePassages.current = getFlat();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan]);

  useEffect(() => {
    if (showBook(cols) && allBookData.length === 0) fetchBooks(lang);
    let initData = Array<Array<any>>();
    let rowInfo = Array<IRowInfo>();
    const getPassage = async (
      passage: Passage,
      list: (string | number)[][],
      ids: Array<ISequencedRecordIdentity>
    ) => {
      if (!passage.attributes) return;
      let newRow;
      if (showBook(cols)) {
        newRow = [
          '',
          '',
          passage.attributes.sequencenum,
          passage.attributes.book,
          passage.attributes.reference,
          passage.attributes.title,
        ];
      } else {
        newRow = [
          '',
          '',
          passage.attributes.sequencenum,
          passage.attributes.reference,
          passage.attributes.title,
        ];
      }
      list.push(newRow);
      ids.push({
        type: 'passage',
        id: passage.id,
        sequencenum: passage.attributes.sequencenum,
      });
    };
    const getSectionPassages = async (sec: Section) => {
      // query filter doesn't work with JsonApi since id not translated
      let sectionpassages = passages.filter(
        (p) => related(p, 'section') === sec.id
      );
      if (sectionpassages != null) {
        let passageids = Array<Array<string | number>>();
        let ids = Array<ISequencedRecordIdentity>();
        for (
          let psgIndex = 0;
          psgIndex < sectionpassages.length;
          psgIndex += 1
        ) {
          await getPassage(sectionpassages[psgIndex], passageids, ids);
        }
        passageids = passageids.sort((i, j) => {
          return (
            parseInt(i[cols.PassageSeq].toString()) -
            parseInt(j[cols.PassageSeq].toString())
          );
        });
        ids = ids.sort((i, j) => {
          return i.sequencenum - j.sequencenum;
        });
        for (let psgIndex = 0; psgIndex < passageids.length; psgIndex += 1) {
          if (inlinePassages.current && psgIndex === 0) {
            rowInfo[rowInfo.length - 1].passageId = ids[psgIndex];
            for (let ix = 2; ix < initData[rowInfo.length - 1].length; ix += 1)
              initData[rowInfo.length - 1][ix] = passageids[psgIndex][ix];
          } else {
            rowInfo.push({ passageId: ids[psgIndex] } as IRowInfo);
            initData.push(passageids[psgIndex]);
          }
          var rec = getMediaRec(ids[psgIndex].id, memory);
          rowInfo[rowInfo.length - 1].mediaId = rec !== null ? rec.id : '';
          /*
          if (mf) {

            if (passMedia.hasOwnProperty(ids[psgIndex].id)) {
              passMedia[ids[psgIndex].id].push(mf);
            } else {
              passMedia[ids[psgIndex].id] = [mf];
            }
          } */
        }
      }
    };
    const getSections = async (plan: string) => {
      let plansections = sections
        .filter((s) => related(s, 'plan') === plan)
        .sort((i, j) => i.attributes?.sequencenum - j.attributes?.sequencenum);
      if (plansections != null) {
        for (let secIndex = 0; secIndex < plansections.length; secIndex += 1) {
          let sec = plansections[secIndex] as Section;
          if (!sec.attributes) continue;
          rowInfo.push({
            sectionId: {
              type: 'section',
              id: sec.id,
              sequencenum: sec.attributes.sequencenum,
            },
            editor: related(sec, 'editor'),
            transcriber: related(sec, 'transcriber'),
          } as IRowInfo);
          let newRow;
          if (showBook(cols)) {
            newRow = [
              sec.attributes.sequencenum,
              sec.attributes.name,
              '',
              '',
              '',
              '',
            ];
          } else {
            newRow = [
              sec.attributes.sequencenum,
              sec.attributes.name,
              '',
              '',
              '',
            ];
          }
          initData.push(newRow);
          await getSectionPassages(sec);
        }
      }
    };
    const setUpdate = (value: boolean) => (updateRef.current = value);
    if (
      !savingRef.current &&
      !myChangedRef.current &&
      plan &&
      !updateRef.current
    ) {
      setUpdate(true);
      getSections(plan as string).then(() => {
        setData(initData);
        setInData(initData.map((row: Array<any>) => [...row]));
        setRowInfo(rowInfo);
        getLastModified(plan);
        setUpdate(false);
      });
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [plan, sections, passages, inlinePassages.current, savingRef.current]);

  useEffect(() => {
    const colMx = data.reduce(
      (prev, cur, i) =>
        cur.map((v, i) =>
          Math.max(
            prev[i],
            !v ? 1 : typeof v === 'number' ? v.toString().length : v.length
          )
        ),
      [0, 0, 0, 0, 0, 0, 0]
    );
    const total = colMx.reduce((prev, cur) => prev + cur, 0);
    const colMul = colMx.map((v) => v / total);
    const extra = Math.max(width - 1020, 0);
    const colAdd = colMul.map((v) => Math.floor(extra * v));
    let colHead = [
      { value: organizedBy, readOnly: true, width: 60 + colAdd[0] },
      { value: t.title, readOnly: true, width: 100 + colAdd[1] },
      { value: t.passage, readOnly: true, width: 60 + colAdd[2] },
    ];
    let nx = 3;
    if (showBook(cols)) {
      colHead = colHead.concat([
        { value: t.book, readOnly: true, width: 170 + colAdd[4] },
      ]);
      nx += 1;
    }
    colHead = colHead.concat([
      { value: t.reference, readOnly: true, width: 120 + colAdd[nx] },
      { value: t.description, readOnly: true, width: 100 + colAdd[nx + 1] },
    ]);
    nx += 2;
    colHead = colHead.concat([
      {
        value: t.action,
        readOnly: true,
        width: 50,
      },
    ]);
    if (
      colHead.length !== columns.length ||
      columns[1].width !== colHead[1].width
    ) {
      setColumns(colHead);
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [data, width, cols]);

  if (view !== '') return <StickyRedirect to={view} />;

  const afterUpload = async (planId: string, mediaRemoteIds?: string[]) => {
    if (
      mediaRemoteIds &&
      mediaRemoteIds.length > 0 &&
      uploadRow.current !== undefined
    ) {
      const passId = passageId(uploadRow.current);
      await attachPassage(
        passId,
        related(
          passages.find((p) => p.id === passId),
          'section'
        ),
        plan,
        remoteIdGuid('mediafile', mediaRemoteIds[0], keyMap) ||
          mediaRemoteIds[0]
      );
    }
    uploadRow.current = undefined;
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
        rowData={data as Array<Array<any>>}
        rowInfo={rowInfo as Array<IRowInfo>}
        bookCol={showBook(cols) ? cols.Book : -1}
        bookMap={bookMap}
        bookSuggestions={bookSuggestions}
        action={handleDelete}
        addSection={addSection}
        addPassage={addPassage}
        updateData={updateData}
        paste={handleTablePaste}
        lookupBook={handleLookupBook}
        resequence={handleResequence}
        inlinePassages={inlinePassages.current}
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
        mediaId={
          uploadRow.current !== undefined
            ? rowInfo[uploadRow.current].mediaId
            : ''
        }
        importList={importList}
        isOpen={uploadVisible}
        onOpen={handleUploadVisible}
        showMessage={showMessage}
        setComplete={setComplete}
        multiple={false}
        finish={afterUpload}
        status={status}
      />
      {audacityOpen && rowInfo[audacityItem].passageId && (
        <AudacityManager
          item={audacityItem}
          open={audacityOpen}
          onClose={handleAudacityClose}
          passageId={rowInfo[audacityItem].passageId as RecordIdentity}
          mediaId={rowInfo[audacityItem].mediaId || ''}
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
