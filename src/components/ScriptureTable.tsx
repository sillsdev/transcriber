import React, { useState, useEffect } from 'react';
import { useGlobal } from 'reactn';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import {
  IState,
  PassageSection,
  Section,
  Passage,
  IPlanSheetStrings,
  IScriptureTableStrings,
  BookNameMap,
  BookName,
} from '../model';
import { OptionType } from '../components/ReactSelect';
import localStrings from '../selector/localize';
import * as actions from '../store';
import { withData, WithDataProps } from 'react-orbitjs';
import { TransformBuilder, RecordIdentity, QueryBuilder } from '@orbit/data';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import { LinearProgress } from '@material-ui/core';
import SnackBar from './SnackBar';
import PlanSheet from './PlanSheet';
import Related, { related } from '../utils/related';

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
    }),
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
  passageSections: Array<PassageSection>;
  passages: Array<Passage>;
  sections: Array<Section>;
}
interface IProps
  extends IStateProps,
    IDispatchProps,
    IRecordProps,
    WithDataProps {
  setChanged?: (v: boolean) => void;
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
    queryStore,
    setChanged,
    passageSections,
    passages,
    sections,
  } = props;
  const classes = useStyles();
  const [plan] = useGlobal('plan');
  const [project] = useGlobal('project');
  const [memory] = useGlobal('memory');
  const [schema] = useGlobal('schema');
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  const addSection = () => {
    const sequenceNums = data.map(row => row[cols.SectionSeq] || 0) as number[];
    const sequencenum = Math.max(...sequenceNums, 0) + 1;
    var newRow;
    if (showBook(cols)) {
      newRow = [sequencenum, '', '', '', '', ''];
    } else {
      newRow = [sequencenum, '', '', '', ''];
    }
    setData([...data.concat([newRow])]);
    setInData([...inData.concat([newRow])]);
    setRowId(rowId.concat([newSectionId(sequencenum)]));
  };
  const addPassage = () => {
    const lastRow = data.length - 1; //FUTURE TODO? pass in section row?
    const sequencenum = (data[lastRow][cols.PassageSeq] || 0) + 1;
    var newRow;
    if (showBook(cols)) {
      const book = data[lastRow][cols.Book] || '';
      newRow = ['', '', sequencenum, book, '', ''];
    } else {
      newRow = ['', '', sequencenum, '', ''];
    }

    setData([...data.concat([newRow])]);
    setInData([...inData.concat([newRow])]);
    setRowId(rowId.concat([newPassageId(sequencenum)]));
  };
  const handleAction = (what: string, where: number[]) => {
    if (what === 'Delete') {
      const deleteRow = async (id: RecordIdentity) => {
        if (id.type === 'passage') {
          const ids = passageSections
            .filter(ps => related(ps, 'passage') === id.id)
            .map(ps => ps.id);
          ids.forEach(ps => {
            memory.update((t: TransformBuilder) =>
              t.removeRecord({ type: 'passagesection', id: ps })
            );
          });
        }
        memory.update((t: TransformBuilder) =>
          t.removeRecord({ type: id.type, id: id.id })
        );
      };
      for (
        let rowListIndex = 0;
        rowListIndex < where.length;
        rowListIndex += 1
      ) {
        const rowIndex = where[rowListIndex];
        deleteRow(rowId[rowIndex]);
      }
      setData(data.filter((row, rowIndex, arr) => !where.includes(rowIndex)));
      setRowId(rowId.filter((row, rowIndex, arr) => !where.includes(rowIndex)));
      setInData(
        inData.filter((row, rowIndex, arr) => !where.includes(rowIndex))
      );
      return true;
    }
    setMessage(<span>{what}...</span>);
    return false;
  };
  const validTable = (rows: string[][]) => {
    if (rows.length === 0) return false;
    if (showBook(cols)) {
      if (rows[0].length !== 6) return false;
    } else {
      if (rows[0].length !== 5) return false;
    }
    if (
      rows.filter(
        (row, rowIndex) =>
          rowIndex > 0 && !/^[0-9]*$/.test(row[cols.SectionSeq])
      ).length > 0
    )
      return false;
    if (
      rows.filter(
        (row, rowIndex) =>
          rowIndex > 0 && !/^[0-9]*$/.test(row[cols.PassageSeq])
      ).length > 0
    )
      return false;
    return true;
  };
  const lookupBook = (userBookDes: string): string => {
    const userBookDesUc = userBookDes.toLocaleUpperCase();
    if (userBookDesUc !== '' && !bookMap[userBookDesUc]) {
      const proposed = allBookData.filter(
        bookName =>
          bookName.short.toLocaleUpperCase() === userBookDesUc ||
          bookName.long.toLocaleUpperCase() === userBookDesUc ||
          bookName.abbr.toLocaleUpperCase() === userBookDesUc
      );
      if (proposed.length >= 1) return proposed[0].code;
    }
    return userBookDesUc;
  };
  const handlePaste = (rows: string[][]) => {
    if (setChanged) setChanged(true);
    if (validTable(rows)) {
      const startRow = /^[0-9]*$/.test(rows[0][cols.SectionSeq]) ? 0 : 1;
      /* Make it clear which columns can be imported by blanking others */
      setData([
        ...data.concat(
          rows
            .filter((row, rowIndex) => rowIndex >= startRow)
            .map(row =>
              row.map((col, colIndex) =>
                /^[0-9]+$/.test(row[cols.SectionSeq])
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
            .map(row =>
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
            .map(row => {
              if (/^[0-9]+$/.test(row[cols.SectionSeq])) {
                return newSectionId(parseInt(row[cols.SectionSeq]));
              } else {
                return newPassageId(parseInt(row[cols.PassageSeq]));
              }
            })
        ),
      ]);
      return Array<Array<string>>();
    }
    return rows;
  };
  const updateData = (rows: string[][]) => {
    setData(rows);
  };
  const handleSave = async (rows: string[][]) => {
    const saveNewPassage = async (rowIndex: number, secId: string) => {
      const passageRow = rows[rowIndex];
      const p = {
        type: 'passage',
        attributes: {
          sequencenum: passageRow[cols.PassageSeq],
          book: showBook(cols) ? passageRow[cols.Book] : '',
          reference: passageRow[cols.Reference],
          title: passageRow[cols.Title],
          position: 0,
          hold: false,
          state: 'noMedia',
        },
      } as any;
      schema.initializeRecord(p);
      const passageSection = {
        type: 'passagesection',
        attributes: {
          sectionId: 0,
          passageId: 0,
        },
      } as any;
      await memory.update((t: TransformBuilder) => [t.addRecord(p)]);
      await memory.update((t: TransformBuilder) => [
        t.addRecord(passageSection),
        t.replaceRelatedRecord(
          { type: 'passagesection', id: passageSection.id },
          'section',
          { type: 'section', id: secId }
        ),
        t.replaceRelatedRecord(
          { type: 'passagesection', id: passageSection.id },
          'passage',
          { type: 'passage', id: p.id }
        ),
      ]);
      return p;
    };
    const updatePassage = async (rowIndex: number) => {
      const passageRow = rows[rowIndex];
      const inpRow = inData[rowIndex];
      var changed = false;
      for (var i = 0; i < inpRow.length; i++) {
        if (inpRow[i] !== passageRow[i]) {
          changed = true;
          break;
        }
      }
      if (changed) {
        let passage = (await queryStore(q =>
          q.findRecord(rowId[rowIndex])
        )) as Passage;
        passage.attributes.sequencenum = parseInt(passageRow[cols.PassageSeq]);
        if (showBook(cols)) passage.attributes.book = passageRow[cols.Book];
        passage.attributes.reference = passageRow[cols.Reference];
        passage.attributes.title = passageRow[cols.Title];
        delete passage.relationships;
        await memory.update((t: TransformBuilder) => t.updateRecord(passage));
        inpRow[cols.PassageSeq] = passage.attributes.sequencenum;
        if (showBook(cols)) inpRow[cols.Book] = passage.attributes.book;
        inpRow[cols.Reference] = passage.attributes.reference;
        inpRow[cols.Title] = passage.attributes.title;
        await setInData(
          inData
            .slice(0, rowIndex)
            .concat([inpRow])
            .concat(inData.slice(rowIndex + 1))
        );
      }
    };

    const newRowId = async (rowIndex: number, id: string) => {
      console.log('Set id on new row', rowIndex, id, rowId.length);
      let inpRow = rowId[rowIndex];
      inpRow.id = id;
      await setRowId(
        rowId
          .slice(0, rowIndex)
          .concat([inpRow])
          .concat(rowId.slice(rowIndex + 1))
      );
    };
    const doPassages = async (rowIndex: number, secId: string) => {
      rowIndex += 1;
      while (rowIndex < rows.length && isPassageRow(rowId[rowIndex])) {
        if (isPassageRow(rowId[rowIndex])) {
          if (rowId[rowIndex].id === '') {
            let passage = await saveNewPassage(rowIndex, secId);
            newRowId(rowIndex, passage.id);
          } else {
            updatePassage(rowIndex);
          }
        }
        rowIndex += 1;
      }
    };
    const saveNewSection = async (
      rowIndex: number,
      planId: string,
      projectId: string
    ) => {
      const sectionRow = rows[rowIndex];
      const sec = {
        type: 'section',
        attributes: {
          sequencenum: parseInt(sectionRow[cols.SectionSeq]),
          name: sectionRow[cols.SectionnName],
        },
      } as any;
      schema.initializeRecord(sec);
      await memory.update((t: TransformBuilder) => [
        t.addRecord(sec),
        t.replaceRelatedRecord({ type: 'section', id: sec.id }, 'plan', {
          type: 'plan',
          id: planId,
        }),
      ]);
      return sec;
    };
    const updateSection = async (rowIndex: number) => {
      const sectionRow = rows[rowIndex];
      const inpRow = inData[rowIndex];
      if (
        sectionRow[cols.SectionSeq] !== inpRow[cols.SectionSeq] ||
        sectionRow[cols.SectionnName] !== inpRow[cols.SectionnName]
      ) {
        console.log('saving section');
        let section = (await queryStore(q =>
          q.findRecord(rowId[rowIndex])
        )) as Section;
        section.attributes.sequencenum = parseInt(sectionRow[cols.SectionSeq]);
        section.attributes.name = sectionRow[cols.SectionnName];
        delete section.relationships;
        await memory.update((t: TransformBuilder) => t.updateRecord(section));
        //update inData
        inpRow[cols.SectionSeq] = section.attributes.sequencenum;
        inpRow[cols.SectionnName] = section.attributes.name;
        await setInData(
          inData
            .slice(0, rowIndex)
            .concat([inpRow])
            .concat(inData.slice(rowIndex + 1))
        );
      }
      return rowId[rowIndex];
    };
    for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
      setComplete(Math.min((rowIndex * 100) / rows.length, 100));
      if (isSectionRow(rowId[rowIndex])) {
        if (!rowId[rowIndex].id) {
          let section = await saveNewSection(
            rowIndex,
            plan as string,
            project as string
          );
          newRowId(rowIndex, section.id);
          doPassages(rowIndex, section.id);
        } else {
          let section = await updateSection(rowIndex);
          doPassages(rowIndex, section.id);
        }
      }
    }
    if (setChanged) setChanged(false);
    setComplete(0);
  };

  useEffect(() => {
    if (showBook(cols)) fetchBooks(lang);
    let initData = Array<Array<any>>();
    let rowIds = Array<ISequencedRecordIdentity>();
    const getPassage = async (
      pId: string,
      list: (string | number)[][],
      ids: Array<ISequencedRecordIdentity>
    ) => {
      let passage = passages.find(p => p.id === pId);
      if (passage != null) {
        if (!passage.attributes) return;
        var newRow;
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
      }
    };
    const getPassageSection = async (sec: Section) => {
      // query filter doesn't work with JsonApi since id not translated
      let sectionpassages = passageSections.filter(
        ps => Related(ps, 'section') === sec.id
      );
      if (sectionpassages != null) {
        let passageids = Array<Array<string | number>>();
        let ids = Array<ISequencedRecordIdentity>();
        for (
          let psgIndex = 0;
          psgIndex < sectionpassages.length;
          psgIndex += 1
        ) {
          let ps = sectionpassages[psgIndex] as PassageSection;
          await getPassage(Related(ps, 'passage'), passageids, ids);
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
        .filter(s => related(s, 'plan') === plan)
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
          var newRow;
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
          await getPassageSection(sec);
        }
      }
    };
    getSections(plan as string).then(() => {
      setData(initData);
      setInData(initData);
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
        save={handleSave}
        action={handleAction}
        addSection={addSection}
        addPassage={addPassage}
        updateData={updateData}
        paste={handlePaste}
        lookupBook={lookupBook}
        setChanged={setChanged}
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
  passageSections: (q: QueryBuilder) => q.findRecords('passagesection'),
};

export default withData(mapRecordsToProps)(connect(
  mapStateToProps,
  mapDispatchToProps
)(ScriptureTable) as any) as any;
