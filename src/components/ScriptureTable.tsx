import React, { useState, useEffect  } from 'react';
import { useGlobal } from 'reactn';
import { connect } from 'react-redux';
import { IState, Plan, Section, Passage, IPlanSheetStrings, IScriptureTableStrings } from '../model';
import localStrings from '../selector/localize';
import { withData } from 'react-orbitjs';
import Store from '@orbit/store';
import { Schema } from '@orbit/data';
import { withStyles, WithStyles, Theme } from '@material-ui/core/styles';
import SnackBar from './SnackBar';
import PlanSheet from './PlanSheet';

const styles = (theme: Theme) => ({
  container: {
      display: 'flex',
  },
  paper: {
  },
  actions: theme.mixins.gutters({
    paddingBottom: 16,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'right'
  }),
  button: {
    margin: theme.spacing.unit
  },
  icon: {
    marginLeft: theme.spacing.unit
  },
});

interface IStateProps {
  t: IScriptureTableStrings;
  s: IPlanSheetStrings;
};

interface IProps extends IStateProps, WithStyles<typeof styles>{
};
  
export function ScriptureTable(props: IProps) {
    const { classes, t, s } = props;
    const [plan] = useGlobal('plan');
    const [project] = useGlobal('project');
    const [dataStore] = useGlobal('dataStore');
    const [schema] = useGlobal('schema');
    const [message, setMessage] = useState(<></>);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [columns, setColumns] = useState([
      {value: t.section,  readOnly: true, width: 80},
      {value: t.title,  readOnly: true, width: 280},
      {value: t.passage, readOnly: true, width: 80},
      {value: t.book, readOnly: true, width: 100},
      {value: t.reference, readOnly: true, width: 180},
      {value: t.description, readOnly: true, width: 280},
    ]);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [data, setData] = useState([
      [1,"Luke wrote this book about Jesus for Theophilus",'','LUK',"Section 1:1–4",''],
      ['','',1,'LUK',"1:1-4",''],
      [2,"An angel said that John the Baptizer would be born",'','LUK',"Section 1:5–25",''],
      ['','',1,'LUK',"1:5-7",''],
      ['','',2,'LUK',"1:8-10",''],
      ['','',3,'LUK',"1:11-17",''],
      ['','',4,'LUK',"1:18-20",''],
      ['','',5,'LUK',"1:21-25",''],
      [3,"An angel told Mary that Jesus would be born",'','LUK',"Section 1:26–38",''],
      ['','',1,'LUK',"1:26-28",''],
      ['','',2,'LUK',"1:29-34",''],
      ['','',3,'LUK',"1:35-38",''],
      [4,"Mary visited Elizabeth",'','LUK',"Section 1:39–45",''],
      ['','',1,'LUK',"1:39-45",''],
      [5,"Mary praised God",'','LUK',"Section 1:46–56",''],
      ['','',1,'LUK',"1:46-56",''],
      [6,"John the Baptizer was born and received his name",'','LUK',"Section 1:57–66",''],
      ['','',1,'LUK',"1:57-58",''],
      ['','',2,'LUK',"1:59-64",''],
      ['','',3,'LUK',"1:65-66",''],
      [7,"Zechariah prophesied and praised God",'','LUK',"Section 1:67–80",''],
      ['','',1,'LUK',"1:67-80",''],
    ]);

    const handleMessageReset = () => { setMessage(<></>) }
    const handleSave = (rows: string[][]) => {
      const addPassage = async (p: Passage, sId: string) => {
        (schema as Schema).initializeRecord(p);
        const passageSection = {
          type: 'passagesection'
        } as any;
        (schema as Schema).initializeRecord(passageSection);
        const result =
          await (dataStore as Store).update(t => [
            t.addRecord(p),
            t.addRecord(passageSection),
            t.replaceRelatedRecord(
              {type: 'passagesection', id: passageSection.id},
              'section',
              {type: 'section', id: sId},
            ),
            t.replaceRelatedRecord(
              {type: 'passagesection', id: passageSection.id},
              'passage',
              {type: 'passage', id: p.id},
            ),
          ]);
        console.log(result)
        // return result;
      }
      const doPassages = (i: number, sId: string) => {
        do {
          const passageRow = rows[i];
          if (/^[0-9]+$/.test(passageRow[2])) {
            const passage = {
              type: 'passage',
              attributes: {
                sequencenum: passageRow[2],
                book: passageRow[3],
                reference: passageRow[4],
                title: passageRow[5],
                position: 0,
                hold: false,
                state: 1,
              },
            } as any;
            addPassage(passage, sId);
          }
          i += 1;
        } while (i < rows.length && rows[i][0] === '');
      }
      const addSection = async (i: number, s: Section, planId: string, projectId: string) => {
        (schema as Schema).initializeRecord(s);
        await (dataStore as Store).update(t => [
          t.addRecord(s),
          t.replaceRelatedRecord(
            {type: 'section', id: s.id},
            'plan',
            {type: 'plan', id: planId}
          ),
        ]);
        return s;
      }
      for (let i=0; i < rows.length; i += 1) {
        if (/^[0-9]+$/.test(rows[i][0])) {
          const sectionRow = rows[i];
          const section = {
            type: 'section',
            attributes: {
              sequencenum: parseInt(sectionRow[0]),
              name: sectionRow[1],
            },
          } as any;
          addSection(i, section, plan as string, project as string)
            .then(s => doPassages(i, s.id))
            .catch(e => alert(i.toString() + ':' + JSON.stringify(e) + ':' + JSON.stringify(section)));
        }
      }
    }

    useEffect(() => {
      const getSections = async (p: Plan) => {
        let sections = await (dataStore as Store).query(q => q.findRelatedRecords({type: 'plan', id: p}, 'sections'))
        if (sections != null) {
          for (let i = 0; i < sections.length; i += 1) {
            let s = sections[i];
            const getPassages = async (s: Section) => {
              // const sectionId = (keyMap as KeyMap).idToKey('section', 'remoteId', (s.id as string));
              // let passages = await (dataStore as Store).query(q =>
              //   q.findRecords('passage').filter({relation: 'sections', record: {type: 'section', id: sectionId}}))
              // if (passages != null) {
              //   console.log(passages)
              // }
            }
            getPassages(s);
          }
        }
      }
      getSections(plan as Plan);
    }, [])

    return (
      <div className={classes.container}>
        <PlanSheet
          columns={columns}
          rowData={data as any[][]}
          save={handleSave}
          t={s}
        />
        <SnackBar {...props} message={message} reset={handleMessageReset} />
      </div>
    );
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, {layout: "scriptureTable"}),
  s: localStrings(state, {layout: "planSheet"})
});
    
const mapRecordsToProps = {
}

export default withStyles(styles, { withTheme: true })(
  withData(mapRecordsToProps)(
    connect(mapStateToProps)(ScriptureTable) as any
  ) as any
) as any;
      