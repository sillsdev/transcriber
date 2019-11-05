import React, { useState, useEffect } from 'react';
import { useGlobal } from 'reactn';
import { connect } from 'react-redux';
import {
  IState,
  Plan,
  Section,
  PassageSection,
  Role,
  Passage,
  User,
} from '../model';
import { withData, WithDataProps } from 'react-orbitjs';
import { QueryBuilder } from '@orbit/data';
import TreeChart, {
  IPlanRow,
  IWork,
  ITargetWork,
} from '../components/TreeChart';
import { related } from '../utils';

interface IStateProps {}

interface IRecordProps {
  plans: Array<Plan>;
  sections: Array<Section>;
  passageSections: Array<PassageSection>;
  roles: Array<Role>;
  passages: Array<Passage>;
  users: Array<User>;
}

interface IProps extends IStateProps, IRecordProps, WithDataProps {}

export function Visualize(props: IProps) {
  const { plans, sections, passageSections, roles, passages, users } = props;
  const [project] = useGlobal('project');
  const [rows, setRows] = useState<Array<IPlanRow>>([]);
  const [data1, setData1] = useState<Array<IWork>>([]);
  const [data2, setData2] = useState<Array<IWork>>([]);

  interface ITotal {
    [key: string]: number;
  }

  const getData = (tot: ITotal) => {
    let review = Array<ITargetWork>();
    let transcribe = Array<ITargetWork>();
    for (let [key, value] of Object.entries(tot)) {
      const part = key.split(':');
      if (part[2] === 'reviewer') {
        review.push({
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
      { task: 'Review', work: review },
      { task: 'Transcribe', work: transcribe },
    ];
  };

  useEffect(() => {
    let rowTot = {} as ITotal;
    let personTot = {} as ITotal;
    let statusTot = {} as ITotal;
    const selPlans = plans.filter(p => related(p, 'project') === project);
    selPlans.forEach(pl => {
      const planName = pl.attributes.name;
      const selSections = sections.filter(s => related(s, 'plan') === pl.id);
      selSections.forEach(s => {
        const selPassages = passageSections.filter(
          ps => related(ps, 'section') === s.id
        );
        var roleName = 'transcriber';
        var rowKey = pl.id + ':' + roleName;
        rowTot[rowKey] = rowTot.hasOwnProperty(rowKey)
          ? rowTot[rowKey] + selPassages.length
          : selPassages.length;

        var userRec = users.filter(u => u.id === related(s, roleName));
        if (userRec.length > 0) {
          const userName = userRec[0].attributes
            ? userRec[0].attributes.name
            : '';
          const personKey = userName + ':' + planName + ':' + roleName;
          personTot[personKey] = personTot.hasOwnProperty(personKey)
            ? personTot[personKey] + selPassages.length
            : selPassages.length;
        }

        roleName = 'reviewer';
        rowKey = pl.id + ':' + roleName;
        rowTot[rowKey] = rowTot.hasOwnProperty(rowKey)
          ? rowTot[rowKey] + selPassages.length
          : selPassages.length;
        userRec = users.filter(u => u.id === related(s, roleName));
        if (userRec.length > 0) {
          const userName = userRec[0].attributes
            ? userRec[0].attributes.name
            : '';
          const personKey = userName + ':' + planName + ':' + roleName;
          personTot[personKey] = personTot.hasOwnProperty(personKey)
            ? personTot[personKey] + selPassages.length
            : selPassages.length;
        }
        selPassages.forEach(pa => {
          const selPassage = passages.filter(
            p => p.id === related(pa, 'passage')
          );
          if (selPassage.length > 0) {
            const stateName = selPassage[0].attributes
              ? selPassage[0].attributes.state
              : '';
            const statusKey = stateName + ':' + planName + ':' + roleName;
            statusTot[statusKey] = statusTot.hasOwnProperty(statusKey)
              ? statusTot[statusKey] + 1
              : 1;
          }
        });
      });
    });
    setRows(
      selPlans
        .filter(pl => {
          const reviewKey = pl.id + ':reviewer';
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
        .map(pl => {
          return {
            plan: pl.attributes.name,
          };
        })
    );
    setData1(getData(personTot));
    setData2(getData(statusTot));
  }, [project, passageSections, passages, plans, roles, sections, users]);

  return <TreeChart rows={rows} data1={data1} data2={data2} />;
}

const mapStateToProps = (state: IState): IStateProps => ({});

const mapRecordsToProps = {
  plans: (q: QueryBuilder) => q.findRecords('plan'),
  sections: (q: QueryBuilder) => q.findRecords('section'),
  passageSections: (q: QueryBuilder) => q.findRecords('passagesection'),
  roles: (q: QueryBuilder) => q.findRecords('role'),
  passages: (q: QueryBuilder) => q.findRecords('passage'),
  users: (q: QueryBuilder) => q.findRecords('user'),
};

export default withData(mapRecordsToProps)(connect(mapStateToProps)(
  Visualize
) as any) as any;
