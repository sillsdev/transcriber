import React, { useState, useEffect } from 'react';
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
} from '../model';
import localStrings from '../selector/localize';
import * as actions from '../store';
import { withData, WithDataProps } from '../mods/react-orbitjs';
import Memory from '@orbit/memory';
import JSONAPISource from '@orbit/jsonapi';
import { TransformBuilder, RecordIdentity, QueryBuilder } from '@orbit/data';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import { LinearProgress } from '@material-ui/core';
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
} from '../crud';
import { Online, useRemoteSave, lookupBook, currentDateTime } from '../utils';
import { debounce } from 'lodash';
import AssignSection from './AssignSection';
import StickyRedirect from './StickyRedirect';
import Auth from '../auth/Auth';
import Uploader, { statusInit } from './Uploader';
import { useMediaAttach } from '../crud/useMediaAttach';
import { keyMap } from '../schema';

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
    actions: theme.mixins.gutters({
      paddingBottom: 16,
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'flex-end',
    }) as any,
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
  const [doSave, setDoSave] = useGlobal('doSave');
  const [offlineOnly] = useGlobal('offlineOnly');
  const [busy, setBusy] = useGlobal('importexportBusy');
  const [, setConnected] = useGlobal('connected');

  const [saving, setSaving] = useState(false);
  const [changed, setChanged] = useGlobal('changed');
  const { showMessage } = useSnackBar();
  const [rowInfo, setRowInfo] = useState(Array<IRowInfo>());
  const [inlinePassages, setInlinePassages] = useState(false);
  const { getOrganizedBy } = useOrganizedBy();
  const [organizedBy] = useState<string>(getOrganizedBy(true));
  const [columns, setColumns] = useState([
    { value: organizedBy, readOnly: true, width: 80 },
    { value: t.title, readOnly: true, width: 280 },
    { value: t.passage, readOnly: true, width: 80 },
    { value: t.reference, readOnly: true, width: 180 },
    { value: t.description, readOnly: true, width: 280 },
  ]);
  const [projRole] = useGlobal('projRole');
  const [data, setData] = useState(Array<Array<any>>());
  const [inData, setInData] = useState(Array<Array<any>>());
  const [complete, setComplete] = useState(0);
  const [view, setView] = useState('');
  const [lastSaved, setLastSaved] = React.useState<string>();
  const [startSave, saveCompleted, waitForSave] = useRemoteSave();
  const [assignSectionVisible, setAssignSectionVisible] = useState(false);
  const [assignSections, setAssignSections] = useState<number[]>([]);
  const [uploadVisible, setUploadVisible] = useState(false);
  const [status] = useState(statusInit);
  const [uploadPassage, setUploadPassage] = useState('');
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
      inlinePassages &&
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

  const handleDelete = (what: string, where: number[]) => {
    if (what === 'Delete') {
      doDelete(where);
      return true;
    } else {
      showMessage(<span>{what}...</span>);
      return false;
    }
  };
  const doDelete = async (where: number[]) => {
    const deleteOrbitRow = async (id: RecordIdentity | undefined) => {
      if (id && id.id !== '') {
        await memory.update((t: TransformBuilder) => t.removeRecord(id));
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
    updateLastModified();
    setData(
      resequence(data.filter((row, rowIndex) => !where.includes(rowIndex)))
    );
    setRowInfo(rowInfo.filter((row, rowIndex) => !where.includes(rowIndex)));
    setInData(inData.filter((row, rowIndex) => !where.includes(rowIndex)));
    return true;
  };

  const getSections = (where: number[]) => {
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
      if (!inlinePassages) {
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
                  ? (inlinePassages &&
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
                if (inlinePassages && isValidNumber(row[cols.PassageSeq]))
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
    const passageRemoteId = remoteIdNum('passage', id, memory.keyMap);
    if (changed) {
      startSave();
      waitForSave(() => setView(`/work/${prjId}/${passageRemoteId}`), 100);
    } else setView(`/work/${prjId}/${passageRemoteId}`);
  };

  const doAssign = (where: number[]) => {
    setAssignSections(where);
    setAssignSectionVisible(true);
  };
  const handleAssign = (where: number[]) => () => {
    if (changed) {
      startSave();
      waitForSave(() => doAssign(where), 100);
    } else doAssign(where);
  };
  const handleAssignClose = () => () => setAssignSectionVisible(false);

  const showUpload = (i: number) => {
    setUploadVisible(true);
    setUploadPassage(passageId(i));
  };
  const handleUpload = (i: number) => () => {
    if (passageId(i) === '') {
      startSave();
      waitForSave(() => showUpload(i), 100);
    } else showUpload(i);
  };

  const updateLastModified = async () => {
    var planRec = getPlan(plan);
    if (planRec !== null) {
      planRec.attributes.dateUpdated = currentDateTime();
      //don't use sections here, it hasn't been updated yet
      var plansections = memory.cache.query((qb) =>
        qb.findRecords('section')
      ) as Section[];
      planRec.attributes.sectionCount = plansections.filter(
        (s) => related(s, 'plan') === plan
      ).length;
      const myplan = planRec; //assure typescript that the plan isn't null :/
      await memory.update((t: TransformBuilder) => t.updateRecord(myplan));
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

  const getChangedRecs = (changedRows: boolean[]) => {
    let recs: IRecord[][] = [];
    rowInfo.forEach((row, index) => {
      var rec = [];
      if (isSectionRow(row)) {
        rec.push({
          issection: true,
          id: remoteId('section', row.sectionId?.id || '', memory.keyMap),
          changed: changedRows[index],
          sequencenum: data[index][cols.SectionSeq],
          book: showBook(cols) ? data[index][cols.Book] : '',
          reference: data[index][cols.Reference],
          title: data[index][cols.SectionnName],
        });
      }
      if (isPassageRow(row)) {
        if (changedRows[index])
          rec.push({
            issection: false,
            id: remoteId('passage', row.passageId?.id || '', memory.keyMap),
            changed: true,
            sequencenum: data[index][cols.PassageSeq],
            book: showBook(cols) ? data[index][cols.Book] : '',
            reference: data[index][cols.Reference],
            title: data[index][cols.Title],
          });
        //don't bother to push all the passage if not changed
        else
          rec.push({
            issection: false,
            changed: false,
          } as IRecord);
      }
      recs.push(rec);
    });
    return recs;
  };

  const onlineSaveFn = async (recs: IRecord[][], anyNew: boolean) => {
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

  const localSaveFn = async (recs: IRecord[][], anyNew: boolean) => {
    if (!anyNew) return;
    let lastSec: string = '';
    for (let rIdx = 0; rIdx < recs.length; rIdx += 1) {
      const table = recs[rIdx];
      for (let tIdx = 0; tIdx < table.length; tIdx += 1) {
        const item = table[tIdx];
        if (item.changed) {
          if (item.issection) {
            const secRecs = sections.filter((s) => s.id === item.id);
            if (secRecs.length > 0) {
              if (item.changed) {
                await memory.update((t: TransformBuilder) =>
                  t.updateRecord({
                    ...secRecs[0],
                    sequencenum: item.sequencenum,
                    name: item.title,
                    dateUpdated: currentDateTime(),
                  } as Section)
                );
              }
              lastSec = secRecs[0].id;
            } else {
              const secRec: Section = {
                type: 'section',
                attributes: {
                  sequencenum: item.sequencenum,
                  name: item.title,
                  state: ActivityStates.NoMedia,
                  dateCreated: currentDateTime(),
                  dateUpdated: currentDateTime(),
                },
              } as any;
              memory.schema.initializeRecord(secRec);
              const planRecId = { type: 'plan', id: plan };
              await memory.update((t: TransformBuilder) => [
                t.addRecord(secRec),
                t.replaceRelatedRecord(secRec, 'plan', planRecId),
              ]);
              lastSec = secRec.id;
            }
          } else {
            const passRecs = passages.filter((p) => p.id === item.id);
            if (passRecs.length > 0) {
              await memory.update((t: TransformBuilder) =>
                t.updateRecord({
                  ...passRecs[0],
                  sequencenum: item.sequencenum,
                  book: item.book,
                  reference: item.reference,
                  title: item.title,
                  dateUpdated: currentDateTime(),
                } as Passage)
              );
            } else {
              const passRec: Passage = {
                type: 'passage',
                attributes: {
                  sequencenum: item.sequencenum,
                  book: item.book,
                  reference: item.reference,
                  title: item.title,
                  state: ActivityStates.NoMedia,
                  dateCreated: currentDateTime(),
                  dateUpdated: currentDateTime(),
                },
              } as any;
              memory.schema.initializeRecord(passRec);
              const secRecId = { type: 'section', id: lastSec };
              await memory.update((t: TransformBuilder) => [
                t.addRecord(passRec),
                t.replaceRelatedRecord(passRec, 'section', secRecId),
              ]);
            }
          }
        }
      }
    }
  };

  useEffect(() => {
    const handleSave = async () => {
      const saveFn = async (changedRows: boolean[]) => {
        setComplete(10);
        const anyNew = changedRows.includes(true);
        const recs = getChangedRecs(changedRows);
        if (!offlineOnly) onlineSaveFn(recs, anyNew);
        else localSaveFn(recs, anyNew);
      };

      let changedRows: boolean[] = rowInfo.map(
        (row) => row.sectionId?.id === '' || row.passageId?.id === ''
      );
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
      if (numChanges > 200 && !busy) setBusy(true);
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
        await saveFn(someChangedRows);
        numChanges = changedRows.filter((r) => r).length;
      }
      await saveFn(changedRows);
      setBusy(false);
      setComplete(0);
    };

    if (doSave && !saving) {
      Online((online) => {
        setConnected(online);
        if (!online && !offlineOnly) {
          saveCompleted(ts.NoSaveOffline);
          setSaving(false);
        } else {
          setSaving(true);
          showMessage(t.saving);
          handleSave().then(() => {
            saveCompleted('');
            setSaving(false);
          });
        }
      }, auth);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doSave, saving, data, inData, rowInfo]);

  useEffect(() => {
    if (plan !== '') {
      const getFlat = () => {
        var planRec = getPlan(plan);
        if (planRec !== null) return planRec.attributes?.flat;
        return false;
      };

      setInlinePassages(getFlat());
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
          if (inlinePassages && psgIndex === 0) {
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
    if (!saving && !changed && plan) {
      getSections(plan as string).then(() => {
        setData(initData);
        setInData(initData.map((row: Array<any>) => [...row]));
        setRowInfo(rowInfo);
        getLastModified(plan);
      });
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [plan, sections, passages, saving, inlinePassages]);

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
        { value: t.book, readOnly: true, width: 170 + colAdd[3] },
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
        width: projRole === 'admin' ? (inlinePassages ? 250 : 200) : 50,
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
    if (mediaRemoteIds && mediaRemoteIds.length > 0) {
      await attachPassage(
        uploadPassage,
        related(
          passages.find((p) => p.id === uploadPassage),
          'section'
        ),
        plan,
        remoteIdGuid('mediafile', mediaRemoteIds[0], keyMap) ||
          mediaRemoteIds[0]
      );
    }
    setDoSave(true);
  };

  const handleLookupBook = (book: string) =>
    lookupBook({ book, allBookData, bookMap });

  return (
    <div className={classes.container}>
      {complete === 0 || (
        <div className={classes.progress}>
          <LinearProgress variant="determinate" value={complete} />
        </div>
      )}
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
        inlinePassages={inlinePassages}
        onTranscribe={handleTranscribe}
        onAssign={handleAssign}
        onUpload={handleUpload}
        lastSaved={lastSaved}
        auth={auth}
        t={s}
        ts={ts}
      />
      <AssignSection
        sections={getSections(assignSections)}
        visible={assignSectionVisible}
        closeMethod={handleAssignClose()}
      />
      <Uploader
        auth={auth}
        isOpen={uploadVisible}
        onOpen={setUploadVisible}
        showMessage={showMessage}
        setComplete={setComplete}
        multiple={false}
        finish={afterUpload}
        status={status}
      />
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
