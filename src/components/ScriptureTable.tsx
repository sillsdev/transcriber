import React, { useState, useEffect } from 'react';
import { useGlobal } from 'reactn';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
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
} from '../model';
import { OptionType } from '../components/ReactSelect';
import localStrings from '../selector/localize';
import * as actions from '../store';
import { withData, WithDataProps } from '../mods/react-orbitjs';
import { TransformBuilder, RecordIdentity, QueryBuilder } from '@orbit/data';
import {
  makeStyles,
  createStyles,
  Theme,
  useTheme,
} from '@material-ui/core/styles';
import { LinearProgress } from '@material-ui/core';
import SnackBar from './SnackBar';
import PlanSheet from './PlanSheet';
import { remoteId, remoteIdNum, remoteIdGuid, related, Online } from '../utils';
import { isUndefined } from 'util';
import { DrawerTask } from '../routes/drawer';
import { debounce } from 'lodash';
import { useRemoteSave } from '../utils/useRemoteSave';

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
}
interface IRecordProps {
  passages: Array<Passage>;
  sections: Array<Section>;
}
interface IProps
  extends IStateProps,
    IDispatchProps,
    IRecordProps,
    WithDataProps {
  cols: ICols;
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
    passages,
    sections,
  } = props;
  const classes = useStyles();
  const [width, setWidth] = React.useState(window.innerWidth);
  const theme = useTheme();
  const [plan] = useGlobal('plan');
  const [memory] = useGlobal('memory');
  const [remote] = useGlobal('remote');
  const [doSave] = useGlobal('doSave');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [saving, setSaving] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [changed, setChanged] = useGlobal('changed');
  const [isDeveloper] = useGlobal('developer');
  const [message, setMessage] = useState(<></>);
  const [rowId, setRowId] = useState(Array<Array<ISequencedRecordIdentity>>());
  const [inlinePassages, setInlinePassages] = useState({
    defaultSet: false,
    inline: false,
  });

  const [columns, setColumns] = useState([
    { value: t.section, readOnly: true, width: 80 },
    { value: t.title, readOnly: true, width: 280 },
    { value: t.passage, readOnly: true, width: 80 },
    { value: t.reference, readOnly: true, width: 180 },
    { value: t.description, readOnly: true, width: 280 },
  ]);

  const [data, setData] = useState(Array<Array<any>>());
  const [inData, setInData] = useState(Array<Array<any>>());
  const [complete, setComplete] = useState(0);
  const [, saveCompleted] = useRemoteSave();

  const showBook = (cols: ICols) => cols.Book >= 0;

  const handleMessageReset = () => {
    setMessage(<></>);
  };

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

  const isSectionRow = (r: ISequencedRecordIdentity[]) =>
    r[0].type === 'section';
  const isPassageRow = (r: ISequencedRecordIdentity[]) =>
    r[0].type === 'passage' || r.length > 1;

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
  const toggleInline = (event: any) => {
    if (changed) setMessage(<span>{t.saveFirst}</span>);
    else {
      localStorage.setItem(
        'inline-passages',
        inlinePassages.inline ? 'false' : 'true'
      );
      setInlinePassages({ defaultSet: true, inline: !inlinePassages.inline });
    }
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
    } else {
      newRow = [sequencenum, '', '', '', ''];
    }
    var newData = insertAt(data, newRow, i);
    //if added in the middle...resequence
    if (i !== undefined) newData = resequence(newData);
    addPassageTo(
      newData,
      insertAt(inData, newRow, i),
      insertAt(rowId, [newSectionId(sequencenum)], i),
      i,
      true
    );
  };
  const addPassage = (i?: number, before?: boolean) => {
    addPassageTo(data, inData, rowId, i, before);
  };
  const addPassageTo = (
    newData: any[][],
    newIndata: any[][],
    newRowId: ISequencedRecordIdentity[][],
    i?: number,
    before?: boolean
  ) => {
    const lastRow = newData.length - 1;
    var index = i === undefined ? lastRow : i;

    let newRow;
    if (showBook(cols)) {
      const book = newData[lastRow][cols.Book] || '';
      newRow = ['', '', 0, book, '', ''];
    } else {
      newRow = ['', '', 0, '', ''];
    }
    if (
      inlinePassages.inline &&
      isSectionRow(newRowId[index]) &&
      !isPassageRow(newRowId[index])
    ) {
      //no passage on this row yet
      newRow[cols.SectionSeq] = newData[index][cols.SectionSeq];
      newRow[cols.SectionnName] = newData[index][cols.SectionnName];
      newData = resequencePassages(updateRowAt(newData, newRow, index), index);
      setData(newData);
      newRow[cols.SectionSeq] = newIndata[index][cols.SectionSeq];
      newRow[cols.SectionnName] = newIndata[index][cols.SectionnName];
      setInData(updateRowAt(newIndata, newRow, index));
      var rowid = [...newRowId[index]];
      rowid.push(newPassageId(newData[index][cols.PassageSeq] as number));
      newRowId[index] = rowid;
      setRowId([...newRowId]);
    } else {
      newData = insertAt(
        newData,
        newRow,
        index < lastRow ? index + 1 : undefined
      );
      newIndata = insertAt(
        newIndata,
        newRow,
        index < lastRow ? index + 1 : undefined
      );
      newRowId = insertAt(
        newRowId,
        [newPassageId(0)],
        index < lastRow ? index + 1 : undefined
      );
      if (before && newRowId[index].length > 1) {
        //move passage data from section row to new empty row
        movePassageDown(newData, index);
        movePassageDown(newIndata, index);
        //swap rowIds
        rowid = [...newRowId[index]];
        var newrowid = [...newRowId[index + 1]];
        newrowid = [rowid[1]];
        rowid[1] = newPassageId(0);
        newRowId[index] = rowid;
        newRowId[index + 1] = newrowid;
      }
      while (!isSectionRow(newRowId[index])) index -= 1;
      setData(resequencePassages(newData, index));
      setInData([...newIndata]);
      setRowId([...newRowId]);
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

  const handleAction = (what: string, where: number[]) => {
    if (what === 'Delete') {
      const deleteRow = async (id: RecordIdentity) => {
        if (id.id !== '') {
          memory.update((t: TransformBuilder) =>
            t.removeRecord({ type: id.type, id: id.id })
          );
        }
      };
      setChanged(true);

      for (
        let rowListIndex = 0;
        rowListIndex < where.length;
        rowListIndex += 1
      ) {
        const rowIndex = where[rowListIndex];
        deleteRow(rowId[rowIndex][0]);
        if (rowId[rowIndex].length > 1) deleteRow(rowId[rowIndex][1]);
      }
      setData(
        resequence(data.filter((row, rowIndex) => !where.includes(rowIndex)))
      );
      setRowId(rowId.filter((row, rowIndex) => !where.includes(rowIndex)));
      setInData(inData.filter((row, rowIndex) => !where.includes(rowIndex)));
      return true;
    }
    setMessage(<span>{what}...</span>);
    return false;
  };

  const validTable = (rows: string[][]) => {
    if (rows.length === 0) {
      setMessage(<span>{t.pasteNoRows}</span>);
      return false;
    }
    if (showBook(cols)) {
      if (rows[0].length !== 6) {
        setMessage(
          <span>
            {t.pasteInvalidColumnsScripture.replace(
              '{0}',
              rows[0].length.toString()
            )}
          </span>
        );
        return false;
      }
    } else {
      if (rows[0].length !== 5) {
        setMessage(
          <span>
            {t.pasteInvalidColumnsGeneral.replace(
              '{0}',
              rows[0].length.toString()
            )}
          </span>
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
      setMessage(
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
      setMessage(
        <span>
          {t.pasteInvalidSections} {invalidPas.join()}.
        </span>
      );
      return false;
    }
    return true;
  };

  const lookupBook = (userBookDes: string): string => {
    const userBookDesUc = userBookDes?.toLocaleUpperCase() || '';
    if (userBookDesUc !== '' && !bookMap[userBookDesUc]) {
      const proposed = allBookData.filter(
        (bookName) =>
          bookName.short.toLocaleUpperCase() === userBookDesUc ||
          bookName.long.toLocaleUpperCase() === userBookDesUc ||
          bookName.abbr.toLocaleUpperCase() === userBookDesUc
      );
      if (proposed.length >= 1) return proposed[0].code;
    }
    return userBookDesUc;
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
      //setMessage(<span>Pasting...</span>); this doesn't actually ever show up
      const startRow = isBlankOrValidNumber(rows[0][cols.SectionSeq]) ? 0 : 1;
      if (!inlinePassages.inline) {
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
                isValidNumber(row[cols.SectionSeq])
                  ? (inlinePassages.inline &&
                      isValidNumber(row[cols.PassageSeq]) &&
                      parseInt(row[cols.PassageSeq]) === 1) ||
                    colIndex < cols.PassageSeq
                    ? col
                    : ''
                  : colIndex >= cols.PassageSeq
                  ? colIndex !== cols.Book
                    ? col
                    : lookupBook(col)
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
                colIndex !== cols.Book ? col : lookupBook(col)
              )
            )
        ),
      ]);
      setRowId([
        ...rowId.concat(
          rows
            .filter((row, rowIndex) => rowIndex >= startRow)
            .map((row) => {
              if (isValidNumber(row[cols.SectionSeq])) {
                var newid = [newSectionId(parseInt(row[cols.SectionSeq]))];
                if (inlinePassages && isValidNumber(row[cols.PassageSeq]))
                  newid.push(newPassageId(parseInt(row[cols.PassageSeq])));
                return newid;
              } else {
                return [newPassageId(parseInt(row[cols.PassageSeq]))];
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
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (
      c
    ) {
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
    });
  }

  const setDimensions = () => {
    setWidth(window.innerWidth - theme.spacing(DrawerTask));
  };

  useEffect(() => {
    const inlinePref = localStorage.getItem('inline-passages');
    if (inlinePref !== null) {
      setInlinePassages({
        defaultSet: true,
        inline: inlinePref === 'true',
      });
    } else {
      let plansections = sections
        .filter((s) => related(s, 'plan') === plan)
        .map((s) => s.id);
      let sectionpassages = passages.filter((p) =>
        plansections.includes(related(p, 'section'))
      );
      if (sectionpassages.length > 0)
        setInlinePassages({
          defaultSet: true,
          inline: isUndefined(
            sectionpassages.find((p) => p.attributes.sequencenum > 1)
          ),
        });
    }
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

  useEffect(() => {
    const handleSave = async () => {
      const doSave = async (changedRows: boolean[]) => {
        setComplete(10);
        let planid = remoteIdNum('plan', plan, memory.keyMap);
        var anyNew = changedRows.includes(true);
        let recs: IRecord[][] = [];
        rowId.forEach((row, index) => {
          const isSection = isSectionRow(row);
          var rec = [];
          if (changedRows[index]) {
            rec.push({
              issection: isSection,
              id: remoteId(row[0].type, row[0].id, memory.keyMap),
              changed: true,
              sequencenum: isSection
                ? data[index][cols.SectionSeq]
                : data[index][cols.PassageSeq],
              book: showBook(cols) ? data[index][cols.Book] : '',
              reference: data[index][cols.Reference],
              title: isSection
                ? data[index][cols.SectionnName]
                : data[index][cols.Title],
            });
            if (row.length > 1) {
              rec.push({
                issection: false,
                id: remoteId(row[1].type, row[1].id, memory.keyMap),
                changed: true,
                sequencenum: data[index][cols.PassageSeq],
                book: showBook(cols) ? data[index][cols.Book] : '',
                reference: data[index][cols.Reference],
                title: data[index][cols.Title],
              });
            }
          } else {
            rec.push({
              issection: isSection,
              id: remoteId(row[0].type, row[0].id, memory.keyMap),
              changed: false,
            } as IRecord);
            //don't bother to push the passage if not changed
          }
          recs.push(rec);
        });
        let sp: SectionPassage = {
          attributes: {
            data: JSON.stringify(recs),
            planId: planid,
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
          if (anyNew) {
            var rec: SectionPassage = (await remote.query((q: QueryBuilder) =>
              q.findRecord({ type: 'sectionpassage', id: dumbrec.id })
            )) as any;
            if (rec !== undefined) {
              //outrecs is an array of arrays of IRecords
              var outrecs = JSON.parse(rec.attributes.data);
              var newrowid = rowId.map((r) => [...r]);
              newrowid.forEach((row, index) => {
                row.forEach((ri, riindex) => {
                  if (ri.id === '') {
                    var id = remoteIdGuid(
                      ri.type,
                      (outrecs[index][riindex] as IRecord).id,
                      memory.keyMap
                    );
                    ri.id = id;
                  }
                });
              });
              setRowId(newrowid);
              setInData(data.map((row: Array<any>) => [...row]));
            }
          }
        }
      };

      let changedRows: boolean[] = rowId.map(
        (row) => row[0].id === '' || (row.length > 1 && row[1].id === '')
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
      await doSave(changedRows);
      setComplete(0);
    };

    if (doSave && !saving) {
      Online((online) => {
        if (!online) {
          setMessage(<span>{ts.NoSaveOffline}</span>);
          saveCompleted(ts.NoSaveOffline);
          setSaving(false);
        } else {
          setSaving(true);
          setMessage(<span>{t.saving}</span>);
          handleSave().then(() => {
            saveCompleted('');
            setSaving(false);
          });
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doSave, saving, data, inData, rowId]);

  useEffect(() => {
    if (showBook(cols) && allBookData.length === 0) fetchBooks(lang);
    let initData = Array<Array<any>>();
    let rowIds = Array<ISequencedRecordIdentity[]>();
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
          if (inlinePassages.inline && psgIndex === 0) {
            rowIds[rowIds.length - 1].push(ids[psgIndex]);
            for (let ix = 2; ix < initData[rowIds.length - 1].length; ix += 1)
              initData[rowIds.length - 1][ix] = passageids[psgIndex][ix];
          } else {
            rowIds.push([ids[psgIndex]]);
            initData.push(passageids[psgIndex]);
          }
        }
      }
    };
    const getSections = async (plan: string) => {
      let plansections = sections
        .filter((s) => related(s, 'plan') === plan)
        .sort((i, j) => i.attributes.sequencenum - j.attributes.sequencenum);
      if (plansections != null) {
        for (let secIndex = 0; secIndex < plansections.length; secIndex += 1) {
          let sec = plansections[secIndex] as Section;
          if (!sec.attributes) continue;
          rowIds.push([
            {
              type: 'section',
              id: sec.id,
              sequencenum: sec.attributes.sequencenum,
            },
          ]);
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
    if (!saving && !changed) {
      getSections(plan as string).then(() => {
        setData(initData);
        setInData(initData.map((row: Array<any>) => [...row]));
        setRowId(rowIds);
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
            typeof v === 'number' ? v.toString().length : v.length
          )
        ),
      [0, 0, 0, 0, 0, 0, 0]
    );
    const total = colMx.reduce((prev, cur) => prev + cur, 0);
    const colMul = colMx.map((v) => v / total);
    const extra = Math.max(width - 1020, 0);
    const colAdd = colMul.map((v) => Math.floor(extra * v));
    let colHead = [
      { value: t.section, readOnly: true, width: 60 + colAdd[0] },
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
    if (isDeveloper) {
      colHead = colHead.concat([
        { value: t.action, readOnly: true, width: 250 },
      ]);
    }
    if (
      colHead.length !== columns.length ||
      columns[1].width !== colHead[1].width
    ) {
      setColumns(colHead);
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [data, width, cols]);

  return (
    <div className={classes.container}>
      {complete === 0 || (
        <div className={classes.progress}>
          <LinearProgress variant="determinate" value={complete} />
        </div>
      )}
      <PlanSheet
        columns={columns}
        rowData={data as any[][]}
        bookCol={showBook(cols) ? cols.Book : -1}
        bookMap={bookMap}
        bookSuggestions={bookSuggestions}
        action={handleAction}
        addSection={addSection}
        addPassage={addPassage}
        updateData={updateData}
        paste={handleTablePaste}
        lookupBook={lookupBook}
        resequence={handleResequence}
        inlinePassages={inlinePassages.inline}
        toggleInline={toggleInline}
        t={s}
        ts={ts}
      />
      <SnackBar {...props} message={message} reset={handleMessageReset} />
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
    },
    dispatch
  ),
});

const mapRecordsToProps = {
  passages: (q: QueryBuilder) => q.findRecords('passage'),
  sections: (q: QueryBuilder) => q.findRecords('section'),
};

export default withData(mapRecordsToProps)(
  connect(mapStateToProps, mapDispatchToProps)(ScriptureTable) as any
) as any;
