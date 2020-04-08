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
} from '../model';
import { OptionType } from '../components/ReactSelect';
import localStrings from '../selector/localize';
import * as actions from '../store';
import { withData, WithDataProps } from '../mods/react-orbitjs';
import { TransformBuilder, RecordIdentity, QueryBuilder } from '@orbit/data';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import { LinearProgress } from '@material-ui/core';
import SnackBar from './SnackBar';
import PlanSheet from './PlanSheet';
import { saveNewPassage, saveNewSection } from '../crud';
import { remoteId, remoteIdNum, remoteIdGuid, related } from '../utils';

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
  const [plan] = useGlobal('plan');
  const [memory] = useGlobal('memory');
  const [schema] = useGlobal('schema');
  const [remote] = useGlobal('remote');
  const [user] = useGlobal('user');
  const [doSave, setDoSave] = useGlobal('doSave');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [changed, setChanged] = useGlobal('changed');
  const [message, setMessage] = useState(<></>);
  const [rowId, setRowId] = useState(Array<ISequencedRecordIdentity>());
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [columns, setColumns] = useState([
    { value: t.section, readOnly: true, width: 80 },
    { value: t.title, readOnly: true, width: 280 },
    { value: t.passage, readOnly: true, width: 80 },
    { value: t.book, readOnly: true, width: 170 },
    { value: t.reference, readOnly: true, width: 180 },
    { value: t.description, readOnly: true, width: 280 },
  ]);

  const [data, setData] = useState(
    Array<Array<any>>()
    // [[1,"Luke wrote this book about Jesus for Theophilus",'','LUK',"Section 1:1–4",''],
    // ['','',1,'LUK',"1:1-4",''],
    // [2,"An angel said that John the Baptizer would be born",'','LUK',"Section 1:5–25",''],
    // ['','',1,'LUK',"1:5-7",''],
    // ['','',2,'LUK',"1:8-10",''],
  );
  const [inData, setInData] = useState(Array<Array<any>>());
  const [complete, setComplete] = useState(0);
  const showBook = (cols: ICols) => cols.Book >= 0;

  const handleMessageReset = () => {
    setMessage(<></>);
  };

  const isSectionRow = (r: ISequencedRecordIdentity) => r.type === 'section';
  const isPassageRow = (r: ISequencedRecordIdentity) => r.type === 'passage';

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

  const resequence = (data: any[][]) => {
    let change = false;
    let sec = 1;
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
      } else if (isValidNumber(r[cols.PassageSeq])) {
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

  const insertAt = (arr: Array<any>, item: any, index?: number) => {
    const d2 = Array.isArray(item);
    const lastIndex = arr.length - 1;
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
      return [...newArr.concat([d2 ? [...arr[lastIndex]] : arr[lastIndex]])];
    }
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
    setData(resequence(insertAt(data, newRow, i)));
    setInData(insertAt(inData, newRow, i));
    setRowId(insertAt(rowId, newSectionId(sequencenum), i));
    setChanged(true);
  };

  const addPassage = (i?: number) => {
    const lastRow = data.length - 1;
    const sequencenum =
      (data[i ? i : lastRow][cols.PassageSeq] || 1) + (i ? 0 : 1);
    let newRow;
    if (showBook(cols)) {
      const book = data[lastRow][cols.Book] || '';
      newRow = ['', '', sequencenum, book, '', ''];
    } else {
      newRow = ['', '', sequencenum, '', ''];
    }
    setData(resequence(insertAt(data, newRow, i)));
    setInData(insertAt(inData, newRow, i));
    setRowId(insertAt(rowId, newPassageId(sequencenum), i));
    setChanged(true);
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
      for (
        let rowListIndex = 0;
        rowListIndex < where.length;
        rowListIndex += 1
      ) {
        const rowIndex = where[rowListIndex];
        deleteRow(rowId[rowIndex]);
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

  const handleTablePaste = (rows: string[][]) => {
    if (validTable(rows)) {
      //setMessage(<span>Pasting...</span>); this doesn't actually ever show up
      const startRow = isBlankOrValidNumber(rows[0][cols.SectionSeq]) ? 0 : 1;
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
      /* Make it clear which columns can be imported by blanking others */
      setData([
        ...data.concat(
          rows
            .filter((row, rowIndex) => rowIndex >= startRow)
            .map((row) =>
              row.map((col, colIndex) =>
                isValidNumber(row[cols.SectionSeq])
                  ? colIndex < 2
                    ? col
                    : ''
                  : colIndex >= 2
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
                return newSectionId(parseInt(row[cols.SectionSeq]));
              } else {
                return newPassageId(parseInt(row[cols.PassageSeq]));
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
  useEffect(() => {
    const handleSave = async () => {
      const newRowId = (rowIndex: number, id: string) => {
        let inpRow = rowId[rowIndex];
        inpRow.id = id;
        setRowId(
          rowId
            .slice(0, rowIndex)
            .concat([inpRow])
            .concat(rowId.slice(rowIndex + 1))
        );
      };

      const smallSave = async (changedRows: boolean[]) => {
        const updatePassage = (rowIndex: number, sectionid: RecordIdentity) => {
          const passageRow = data[rowIndex];
          const inpRow = [...inData[rowIndex]];
          let passage = memory.cache.query((q) =>
            q.findRecord(rowId[rowIndex])
          ) as Passage;
          passage.attributes.sequencenum = parseInt(
            passageRow[cols.PassageSeq]
          );
          if (showBook(cols)) passage.attributes.book = passageRow[cols.Book];
          passage.attributes.reference = passageRow[cols.Reference];
          passage.attributes.title = passageRow[cols.Title];
          memory.update((t: TransformBuilder) => [
            t.updateRecord(passage),
            t.replaceRelatedRecord(
              { type: 'passage', id: passage.id },
              'section',
              sectionid
            ),
          ]);
          inpRow[cols.PassageSeq] = passage.attributes.sequencenum;
          if (showBook(cols)) inpRow[cols.Book] = passage.attributes.book;
          inpRow[cols.Reference] = passage.attributes.reference;
          inpRow[cols.Title] = passage.attributes.title;
          setInData(
            inData
              .slice(0, rowIndex)
              .concat([inpRow])
              .concat(inData.slice(rowIndex + 1))
          );
        };

        const doPassages = async (
          rowIndex: number,
          section: RecordIdentity
        ) => {
          rowIndex += 1;
          if (data.length !== rowId.length)
            console.log('rows', data.length, 'rowId', rowId.length);
          while (rowIndex < data.length && isPassageRow(rowId[rowIndex])) {
            if (changedRows[rowIndex]) {
              if (rowId[rowIndex].id === '') {
                const passageRow = data[rowIndex];
                const sequencenum = parseInt(passageRow[cols.PassageSeq]);
                const book = showBook(cols) ? passageRow[cols.Book] : '';
                const reference = passageRow[cols.Reference];
                const title = passageRow[cols.Title];
                let passage = await saveNewPassage({
                  sequencenum,
                  book,
                  reference,
                  title,
                  section,
                  schema,
                  memory,
                  user,
                });
                newRowId(rowIndex, passage.id);
              } else {
                updatePassage(rowIndex, section);
              }
            }
            rowIndex += 1;
          }
        };

        const updateSection = (rowIndex: number) => {
          if (changedRows[rowIndex]) {
            const sectionRow = data[rowIndex];
            const inpRow = [...inData[rowIndex]];
            let section = memory.cache.query((q) =>
              q.findRecord(rowId[rowIndex])
            ) as Section;
            section.attributes.sequencenum = parseInt(
              sectionRow[cols.SectionSeq]
            );
            section.attributes.name = sectionRow[cols.SectionnName];
            delete section.relationships;
            memory.update((t: TransformBuilder) => t.updateRecord(section));
            //update inData
            inpRow[cols.SectionSeq] = section.attributes.sequencenum;
            inpRow[cols.SectionnName] = section.attributes.name;
            setInData(
              inData
                .slice(0, rowIndex)
                .concat([inpRow])
                .concat(inData.slice(rowIndex + 1))
            );
          }
          return rowId[rowIndex];
        };

        for (let rowIndex = 0; rowIndex < data.length; rowIndex += 1) {
          if (isSectionRow(rowId[rowIndex])) {
            setComplete(Math.min((rowIndex * 100) / data.length, 100));
            if (!rowId[rowIndex].id) {
              const sectionRow = data[rowIndex];
              const sequencenum = parseInt(sectionRow[cols.SectionSeq]);
              const name = sectionRow[cols.SectionnName];
              const planRecId = { type: 'plan', id: plan };
              let section = (await saveNewSection({
                sequencenum,
                name,
                plan: planRecId,
                schema,
                memory,
              })) as Section;
              newRowId(rowIndex, section.id);
              await doPassages(rowIndex, section);
            } else {
              let section = updateSection(rowIndex);
              await doPassages(rowIndex, section);
            }
          }
        }
      };
      const bigSave = async (changedRows: boolean[]) => {
        setComplete(10);
        let planid = remoteIdNum('plan', plan, memory.keyMap);
        var anyNew = changedRows.includes(true);
        let recs: IRecord[] = [];
        rowId.forEach((row, index) => {
          const isSection = isSectionRow(row);
          if (changedRows[index]) {
            recs.push({
              issection: isSection,
              id: remoteId(row.type, row.id, memory.keyMap),
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
          } else
            recs.push({
              issection: isSection,
              id: remoteId(row.type, row.id, memory.keyMap),
              changed: false,
            } as IRecord);
        });
        let sp: SectionPassage = {
          attributes: {
            data: JSON.stringify(recs),
            planId: planid,
            uuid: generateUUID(),
          },
          type: 'sectionpassage',
        } as SectionPassage;
        schema.initializeRecord(sp);
        setComplete(20);
        console.log('telling orbit to post sectionpassage');
        var dumbrec = await memory.update(
          (t: TransformBuilder) => t.addRecord(sp),
          {
            label: 'Update Plan Section and Passages',
            sources: {
              remote: {
                timeout: 2000000,
              },
            },
          }
        );
        //null only if sent twice by orbit
        if (dumbrec) {
          setComplete(50);
          //dumbrec does not contain the new data...just the new id so go get it
          var rec: SectionPassage = (await remote.query((q: QueryBuilder) =>
            q.findRecord({ type: 'sectionpassage', id: dumbrec.id })
          )) as any;
          if (rec !== undefined) {
            var outrecs = JSON.parse(rec.attributes.data);
            //currently not waiting for these
            memory.sync(await remote.pull((q) => q.findRecords('section')));
            memory.sync(await remote.pull((q) => q.findRecords('passage')));
            if (anyNew) {
              var newrowid = rowId.map((r) => r);
              newrowid.forEach((row, index) => {
                if (row.id === '') {
                  var id = remoteIdGuid(
                    row.type,
                    (outrecs[index] as IRecord).id,
                    memory.keyMap
                  );
                  newrowid[index].id = id;
                }
              });
              console.log('setting newrowid');
              setRowId(newrowid);
              console.log('setting indata', new Date().toLocaleTimeString());
              setInData(data.map((row: Array<any>) => [...row]));
              console.log(
                'done setting indata',
                new Date().toLocaleTimeString()
              );
            }
          }
        }
      };

      let changedRows: boolean[] = rowId.map((row) => row.id === '');
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
      let threshold: number =
        process.env.REACT_APP_BIGSAVE_THRESHOLD === undefined
          ? 10
          : +process.env.REACT_APP_BIGSAVE_THRESHOLD;

      if (numChanges > threshold) {
        await bigSave(changedRows);
      } else {
        await smallSave(changedRows);
      }
      setComplete(0);
    };

    if (doSave) {
      setMessage(<span>{t.saving}</span>);
      handleSave().then(() => {
        setDoSave(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doSave, data]);

  useEffect(() => {
    if (showBook(cols) && allBookData.length === 0) fetchBooks(lang);
    let initData = Array<Array<any>>();
    let rowIds = Array<ISequencedRecordIdentity>();
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
          rowIds.push(ids[psgIndex]);
          initData.push(passageids[psgIndex]);
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
          rowIds.push({
            type: 'section',
            id: sec.id,
            sequencenum: sec.attributes.sequencenum,
          });
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
    getSections(plan as string).then(() => {
      setData(initData);
      setInData(initData.map((row: Array<any>) => [...row]));
      setRowId(rowIds);
    });
    if (showBook(cols)) {
      setColumns([
        { value: t.section, readOnly: true, width: 80 },
        { value: t.title, readOnly: true, width: 280 },
        { value: t.passage, readOnly: true, width: 80 },
        { value: t.book, readOnly: true, width: 170 },
        { value: t.reference, readOnly: true, width: 180 },
        { value: t.description, readOnly: true, width: 280 },
      ]);
    } else {
      setColumns([
        { value: t.section, readOnly: true, width: 80 },
        { value: t.title, readOnly: true, width: 280 },
        { value: t.passage, readOnly: true, width: 80 },
        { value: t.reference, readOnly: true, width: 180 },
        { value: t.description, readOnly: true, width: 280 },
      ]);
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [plan]);

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
        t={s}
      />
      <SnackBar {...props} message={message} reset={handleMessageReset} />
    </div>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'scriptureTable' }),
  s: localStrings(state, { layout: 'planSheet' }),
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
