import React, { useState, useEffect } from 'react';
import { useGlobal } from 'reactn';
import { connect } from 'react-redux';
import { IState, Plan, Section, Role, Passage, User } from '../model';
import { withData, WithDataProps } from '../mods/react-orbitjs';
import { QueryBuilder } from '@orbit/data';
import TreeChart, {
  IPlanRow,
  IWork,
  ITargetWork,
} from '../components/TreeChart';
import { related } from '../crud';

interface IStateProps {}

interface IRecordProps {
  plans: Array<Plan>;
  sections: Array<Section>;
  roles: Array<Role>;
  passages: Array<Passage>;
  users: Array<User>;
}

interface IProps extends IStateProps, IRecordProps, WithDataProps {
  selectedPlan?: string;
}

export function Visualize(props: IProps) {
  const { plans, sections, roles, passages, users, selectedPlan } = props;
  const [project] = useGlobal('project');
  const [rows, setRows] = useState<Array<IPlanRow>>([]);
  const [data1, setData1] = useState<Array<IWork>>([]);
  const [data2, setData2] = useState<Array<IWork>>([]);

  interface ITotal {
    [key: string]: number;
  }

  const getData = (tot: ITotal) => {
    let edit = Array<ITargetWork>();
    let transcribe = Array<ITargetWork>();
    for (let [key, value] of Object.entries(tot)) {
      const part = key.split(':');
      if (part[2] === 'editor') {
        edit.push({
          name: part[0],
          plan: part[1],
          count: value,
        });
      } else if (part[2] === 'transcriber') {
        transcribe.push({
          name: part[0],
          plan: part[1],
          count: value,
        });
      }
    }
    return [
      { task: 'Edit', work: edit },
      { task: 'Transcribe', work: transcribe },
    ];
  };

  useEffect(() => {
    let rowTot = {} as ITotal;
    let personTot = {} as ITotal;
    let statusTot = {} as ITotal;
    const selPlans = plans.filter(
      (p) =>
        related(p, 'project') === project &&
        (!selectedPlan || p.id === selectedPlan)
    );
    selPlans.forEach((pl) => {
      const planName = pl.attributes.name;
      const selSections = sections.filter((s) => related(s, 'plan') === pl.id);
      selSections.forEach((s) => {
        const selPassages = passages.filter(
          (ps) => related(ps, 'section') === s.id
        );
        let roleName = 'transcriber';
        let rowKey = pl.id + ':' + roleName;
        rowTot[rowKey] = rowTot.hasOwnProperty(rowKey)
          ? rowTot[rowKey] + selPassages.length
          : selPassages.length;

        let userRec = users.filter((u) => u.id === related(s, roleName));
        if (userRec.length > 0) {
          const userName = userRec[0].attributes
            ? userRec[0].attributes.name
            : '';
          const personKey = userName + ':' + planName + ':' + roleName;
          personTot[personKey] = personTot.hasOwnProperty(personKey)
            ? personTot[personKey] + selPassages.length
            : selPassages.length;
        }

        roleName = 'editor';
        rowKey = pl.id + ':' + roleName;
        rowTot[rowKey] = rowTot.hasOwnProperty(rowKey)
          ? rowTot[rowKey] + selPassages.length
          : selPassages.length;
        userRec = users.filter((u) => u.id === related(s, roleName));
        if (userRec.length > 0) {
          const userName = userRec[0].attributes
            ? userRec[0].attributes.name
            : '';
          const personKey = userName + ':' + planName + ':' + roleName;
          personTot[personKey] = personTot.hasOwnProperty(personKey)
            ? personTot[personKey] + selPassages.length
            : selPassages.length;
        }
        selPassages.forEach((selPassage) => {
          const stateName = selPassage.attributes
            ? selPassage.attributes.state
            : '';
          const statusKey = stateName + ':' + planName + ':' + roleName;
          statusTot[statusKey] = statusTot.hasOwnProperty(statusKey)
            ? statusTot[statusKey] + 1
            : 1;
        });
      });
    });
    setRows(
      selPlans
        .filter((pl) => {
          const reviewKey = pl.id + ':editor';
          const transKey = pl.id + ':transcriber';
          const reviewTot = rowTot.hasOwnProperty(reviewKey)
            ? rowTot[reviewKey]
            : 0;
          const transTot = rowTot.hasOwnProperty(transKey)
            ? rowTot[transKey]
            : 0;
          return reviewTot + transTot > 0;
        })
        .sort((i, j) => (i.attributes.name < j.attributes.name ? -1 : 1))
        .map((pl) => {
          return {
            plan: pl.attributes.name,
          };
        })
    );
    setData1(getData(personTot));
    setData2(getData(statusTot));
  }, [project, passages, plans, roles, sections, users, selectedPlan]);

  return <TreeChart rows={rows} data1={data1} data2={data2} />;
}

const mapStateToProps = (state: IState): IStateProps => ({});

const mapRecordsToProps = {
  plans: (q: QueryBuilder) => q.findRecords('plan'),
  sections: (q: QueryBuilder) => q.findRecords('section'),
  roles: (q: QueryBuilder) => q.findRecords('role'),
  passages: (q: QueryBuilder) => q.findRecords('passage'),
  users: (q: QueryBuilder) => q.findRecords('user'),
};

export default withData(mapRecordsToProps)(
  connect(mapStateToProps)(Visualize) as any
) as any;
