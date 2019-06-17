import React, { useState, useEffect } from 'react';
import { useGlobal } from 'reactn';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { IState, PassageSection, Section, Passage, IPlanSheetStrings, IAssignmentTableStrings, BookNameMap } from '../model';
import { OptionType } from '../components/ReactSelect';
import localStrings from '../selector/localize';
import * as actions from '../actions';
import { withData } from 'react-orbitjs';
import Store from '@orbit/store';
import { Schema, RecordIdentity } from '@orbit/data';
import { withStyles, WithStyles, Theme } from '@material-ui/core/styles';
import SnackBar from './SnackBar';
import PlanSheet from './PlanSheet';
import Related from '../utils/related';

const styles = (theme: Theme) => ({
  container: {
    display: 'flex',
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
});

interface ISequencedRecordIdentity extends RecordIdentity {
  sequencenum: number;
}

interface IStateProps {
  t: IAssignmentTableStrings;
  s: IPlanSheetStrings;
  lang: string;
  bookSuggestions: OptionType[];
  bookMap: BookNameMap;
}

interface IDispatchProps {
  fetchBooks: typeof actions.fetchBooks;
}

interface IProps extends IStateProps, IDispatchProps, WithStyles<typeof styles> {}

export function AssignmentTable(props: IProps) {
  const { classes, t, s, lang, bookSuggestions, bookMap, fetchBooks } = props;
  const [plan] = useGlobal<string>('plan');
  const [project] = useGlobal<string>('project');
  const [dataStore] = useGlobal('dataStore');
  const [schema] = useGlobal('schema');
  const [message, setMessage] = useState(<></>);
  const [sectionId, setSectionId] = useState(Array<RecordIdentity>());
  const [passageId, setPassageId] = useState(Array<ISequencedRecordIdentity>());
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [columns, setColumns] = useState([{ value: t.section, readOnly: true, width: 80 }, { value: t.title, readOnly: true, width: 280 }, { value: t.passage, readOnly: true, width: 80 }, { value: t.book, readOnly: true, width: 170 }, { value: t.reference, readOnly: true, width: 180 }, { value: t.description, readOnly: true, width: 280 }]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [data, setData] = useState(Array<Array<any>>());
  const [inData, setInData] = useState(Array<Array<any>>());

  const handleMessageReset = () => {
    setMessage(<></>);
  };
  const addSection = () => {
    const sequenceNums = data.map(r => r[0] || 0) as number[];
    const sequencenum = Math.max(...sequenceNums, 0) + 1;
    setData([...data.concat([[sequencenum, '', '', '', '', '']])]);
  };
  const addPassage = () => {
    const lastRow = data.length - 1;
    const sequencenum = (data[lastRow][2] || 0) + 1;
    const book = data[lastRow][3] || '';
    setData([...data.concat([['', '', sequencenum, book, '', '']])]);
  };
  const handleAction = (what: string, where: number[]) => {
    if (what === 'Delete') {
      const deleteRow = async (id: RecordIdentity) => {
        await (dataStore as Store).update(t => t.removeRecord(id));
      };
      for (let j = 0; j < where.length; j += 1) {
        const i = where[j];
        if (sectionId[i] && sectionId[i].id) {
          deleteRow(sectionId[i]);
        }
        if (passageId[i] && passageId[i].id) {
          deleteRow(passageId[i]);
        }
      }
      setData(data.filter((r, i) => !where.includes(i)));
      return true;
    }
    setMessage(<span>{what}...</span>);
    return false;
  };
  const validTable = (rows: string[][]) => {
    if (rows.length === 0) return false;
    if (rows[0].length !== 6) return false;
    if (rows.filter((r, i) => i > 0 && !/^[0-9]*$/.test(r[0])).length > 0) return false;
    if (rows.filter((r, i) => i > 0 && !/^[0-9]*$/.test(r[2])).length > 0) return false;
    return true;
  };
  const handlePaste = (rows: string[][]) => {
    if (validTable(rows)) {
      const startRow = /^[0-9]*$/.test(rows[0][0]) ? 0 : 1;
      setData(data.concat(rows.filter((r, i) => i >= startRow)));
      return Array<Array<string>>();
    }
    return rows;
  };
  const updateData = (rows: string[][]) => {
    setData(rows);
  };
  const handleSave = (rows: string[][]) => {
    const addPassage = async (i: number, sId: string) => {
      const passageRow = rows[i];
      const p = {
        type: 'passage',
        attributes: {
          sequencenum: passageRow[2],
          book: passageRow[3],
          reference: passageRow[4],
          title: passageRow[5],
          position: 0,
          hold: false,
          state: 'Not assigned',
        },
      } as any;
      (schema as Schema).initializeRecord(p);
      const passageSection = {
        type: 'passagesection',
        attributes: {
          sectionId: 0,
          passageId: 0,
        },
      } as any;
      await (dataStore as Store).update(t => [t.addRecord(p), t.addRecord(passageSection), t.replaceRelatedRecord({ type: 'passagesection', id: passageSection.id }, 'section', { type: 'section', id: sId }), t.replaceRelatedRecord({ type: 'passagesection', id: passageSection.id }, 'passage', { type: 'passage', id: p.id })]);
    };
    const changePassage = async (i: number) => {
      const passageRow = rows[i];
      const inpRow = inData[i];
      if (passageRow[2] !== inpRow[2] || passageRow[3] !== inpRow[3] || passageRow[4] !== inpRow[4] || passageRow[5] !== inpRow[5]) {
        let passage = (await (dataStore as Store).query(q => q.findRecord(passageId[i]))) as Passage;
        passage.attributes.sequencenum = parseInt(passageRow[2]);
        passage.attributes.book = passageRow[3];
        passage.attributes.reference = passageRow[4];
        passage.attributes.title = passageRow[5];
        delete passage.relationships;
        await (dataStore as Store).update(t => t.replaceRecord(passage));
      }
    };
    const doPassages = (i: number, sId: string) => {
      do {
        const passageRow = rows[i];
        if (/^[0-9]+$/.test(passageRow[2])) {
          if (!passageId[i]) {
            addPassage(i, sId);
          } else {
            changePassage(i);
          }
        }
        i += 1;
      } while (i < rows.length && rows[i][0] === '');
    };
    const addSection = async (i: number, planId: string, projectId: string) => {
      const sectionRow = rows[i];
      const s = {
        type: 'section',
        attributes: {
          sequencenum: parseInt(sectionRow[0]),
          name: sectionRow[1],
        },
      } as any;
      (schema as Schema).initializeRecord(s);
      await (dataStore as Store).update(t => [t.addRecord(s), t.replaceRelatedRecord({ type: 'section', id: s.id }, 'plan', { type: 'plan', id: planId })]);
      return s;
    };
    const changeSection = async (i: number) => {
      const sectionRow = rows[i];
      const inpRow = inData[i];
      if (sectionRow[0] !== inpRow[0] || sectionRow[1] !== inpRow[1]) {
        let section = (await (dataStore as Store).query(q => q.findRecord(sectionId[i]))) as Section;
        section.attributes.sequencenum = parseInt(sectionRow[0]);
        section.attributes.name = sectionRow[1];
        delete section.relationships;
        await (dataStore as Store).update(t => t.replaceRecord(section));
      }
      return sectionId[i];
    };
    for (let i = 0; i < rows.length; i += 1) {
      if (/^[0-9]+$/.test(rows[i][0])) {
        if (!sectionId[i] || !sectionId[i].id) {
          addSection(i, plan as string, project as string).then(s => doPassages(i, s.id));
        } else {
          changeSection(i).then(s => doPassages(i, s.id));
        }
      }
    }
  };

  useEffect(() => {
    fetchBooks(lang);
    let initData = Array<Array<any>>();
    let sectionIds = Array<RecordIdentity>();
    let passageIds = Array<ISequencedRecordIdentity>();
    const getPassage = async (pId: string, list: (string | number)[][], ids: Array<ISequencedRecordIdentity>) => {
      let passage = (await (dataStore as Store).query(q => q.findRecord({ type: 'passage', id: pId }))) as Passage;
      if (passage != null) {
        if (!passage.attributes) return;
        list.push(['', '', passage.attributes.sequencenum, passage.attributes.book, passage.attributes.reference, passage.attributes.title]);
        ids.push({ type: 'passage', id: passage.id, sequencenum: passage.attributes.sequencenum });
      }
    };
    const getPassageSection = async (s: Section) => {
      let passageSections = (await (dataStore as Store).query(q => q.findRecords('passagesection'))) as Array<PassageSection>;
      // query filter doesn't work with JsonApi since id not translated
      passageSections = passageSections.filter(ps => Related(ps, 'section') === s.id);
      if (passageSections != null) {
        let passages = Array<Array<string | number>>();
        let ids = Array<ISequencedRecordIdentity>();
        for (let j = 0; j < passageSections.length; j += 1) {
          let ps = passageSections[j] as PassageSection;
          await getPassage(Related(ps, 'passage'), passages, ids);
        }
        passages = passages.sort((i, j) => {
          return parseInt(i[2].toString()) - parseInt(j[2].toString());
        });
        ids = ids.sort((i, j) => {
          return i.sequencenum - j.sequencenum;
        });
        for (let j = 0; j < passages.length; j += 1) {
          while (passageIds.length < initData.length) {
            passageIds.push({ type: '', id: '', sequencenum: 0 });
          }
          passageIds[initData.length] = ids[j];
          initData.push(passages[j]);
        }
      }
    };
    const getSections = async (p: string) => {
      let sections = (await (dataStore as Store).query(q => q.findRelatedRecords({ type: 'plan', id: p }, 'sections'))) as Array<Section>;
      // query filter doesn't work with JsonApi since id not translated
      // q.findRecords('section')
      //   .filter({relation: 'plan', record: {type: 'plan', id: p}})
      //   .sort('sequencenum'));
      sections = sections.sort((i, j) => i.attributes.sequencenum - j.attributes.sequencenum);
      if (sections != null) {
        for (let i = 0; i < sections.length; i += 1) {
          let s = sections[i] as Section;
          if (!s.attributes) continue;
          while (sectionIds.length < initData.length) {
            sectionIds.push({ type: '', id: '' });
          }
          sectionIds[initData.length] = { type: 'section', id: s.id };
          initData.push([s.attributes.sequencenum, s.attributes.name, '', '', '', '']);
          await getPassageSection(s);
        }
      }
    };
    getSections(plan as string).then(() => {
      setData(initData);
      setInData(initData);
      setSectionId(sectionIds);
      setPassageId(passageIds);
    });
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  return (
    <div className={classes.container}>
      <PlanSheet columns={columns} rowData={data as any[][]} bookMap={bookMap} bookSuggestions={bookSuggestions} save={handleSave} action={handleAction} addSection={addSection} addPassage={addPassage} updateData={updateData} paste={handlePaste} t={s} />
      <SnackBar {...props} message={message} reset={handleMessageReset} />
    </div>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'assignmentTable' }),
  s: localStrings(state, { layout: 'planSheet' }),
  lang: state.strings.lang,
  bookSuggestions: state.books.suggestions,
  bookMap: state.books.map,
});

const mapDispatchToProps = (dispatch: any): IDispatchProps => ({
  ...bindActionCreators(
    {
      fetchBooks: actions.fetchBooks,
    },
    dispatch
  ),
});

const mapRecordsToProps = {};

export default withStyles(styles, { withTheme: true })(withData(mapRecordsToProps)(connect(
  mapStateToProps,
  mapDispatchToProps
)(AssignmentTable) as any) as any) as any;
