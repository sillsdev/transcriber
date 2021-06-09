import React, { useState, useEffect } from 'react';
import { useGlobal } from 'reactn';
import { connect } from 'react-redux';
import {
  IState,
  IPlanTabsStrings,
  Plan,
  Section,
  Passage,
  MediaFile,
} from '../model';
import localStrings from '../selector/localize';
import { QueryBuilder } from '@orbit/data';
import { withData } from '../mods/react-orbitjs';
import {
  restrictToWindowEdges,
  restrictToVerticalAxis,
} from '@dnd-kit/modifiers';
import {
  Sortable,
  Props as SortableProps,
} from './sortable-component/Sortable';
import { related } from '../crud';
import { createRange } from '../utils';

enum CommentStatus {
  Open,
  Resolved,
}

interface Comment {
  AssignTo: string;
  Status: CommentStatus;
  author: string;
  parent: string;
  order: number;
  category: string[];
  subject: string;
}

enum TaskStatus {
  Created,
  Ready,
  InProgress,
  Done,
  Sync,
}

enum TaskType {
  Section,
  Passage,
  Flat,
  Assign,
  Schedule,
  Record,
  Segment,
  Transcribe,
  Align,
  Review,
  BackTranslate,
  ConsultantCheck,
  CommunityReview,
}

const defaultTasks = [
  { title: 'Record', taskType: TaskType.Record },
  { title: 'Transcribe', taskType: TaskType.Transcribe },
  { title: 'Review', taskType: TaskType.Review },
];

interface IPMap {
  [key: string]: TaskStatus;
}
const pMap: IPMap = {
  transcriberReady: TaskStatus.Ready,
};

interface ITask {
  id: string;
  assignTo: string | undefined;
  title: string;
  book: string;
  ref: string;
  status: TaskStatus;
  taskType: TaskType;
  comment: Comment[];
  start: number | undefined;
  finish: number | undefined;
}

interface IStateProps {
  t: IPlanTabsStrings;
}

interface IRecordProps {
  plans: Plan[];
  sections: Section[];
  passages: Passage[];
  mediafiles: MediaFile[];
}

interface IProps extends SortableProps, IStateProps, IRecordProps {}

export const TaskList = (props: IProps) => {
  const { plans, sections, passages } = props;
  const [plan] = useGlobal('plan');
  const [item, setItem] = useState<ITask[]>([]);
  const getItemStyle = () => {
    return { padding: '0' };
  };

  const addTasks = (id: string, items: ITask[]) => {
    defaultTasks.forEach((t, i) => {
      items.push({
        id: `${id}.${i + 1}`,
        assignTo: undefined,
        title: t.title,
        status: TaskStatus.Created,
        taskType: t.taskType,
        comment: Array<Comment>(),
        start: undefined,
        finish: undefined,
      } as ITask);
    });
  };

  const secSort = (s1: Section, s2: Section) => {
    return s1?.attributes?.sequencenum - s2?.attributes?.sequencenum;
  };

  const pasSort = (p1: Passage, p2: Passage) => {
    return p1?.attributes?.sequencenum - p2?.attributes?.sequencenum;
  };

  useEffect(() => {
    let items = Array<ITask>();
    const planRec = plans.filter((p) => p?.id === plan);
    const flat = planRec.length > 0 ? planRec[0]?.attributes?.flat : true;
    const secRecs = sections
      .filter((s) => related(s, 'plan') === plan)
      .sort(secSort);
    secRecs.forEach((s) => {
      const sAttr = s?.attributes;
      if (!flat) {
        items.push({
          id: `${sAttr?.sequencenum}.0`,
          assignTo: undefined,
          title: sAttr?.name,
          status: TaskStatus.Created,
          taskType: TaskType.Section,
          comment: Array<Comment>(),
          start: Date.now(),
          finish: undefined,
        } as ITask);
      }
      const pasRecs = passages
        .filter((p) => related(p, 'section') === s?.id)
        .sort(pasSort);
      if (pasRecs.length > 0) {
        const pAttr = pasRecs[0]?.attributes;
        let id = '';
        if (flat) {
          id = `${sAttr?.sequencenum}`;
          items.push({
            id,
            assignTo: undefined,
            title: pAttr?.title,
            book: pAttr?.book,
            ref: pAttr?.reference,
            status: pMap[pAttr?.state] ?? TaskStatus.Created,
            taskType: TaskType.Flat,
            comment: Array<Comment>(),
            start: Date.now(),
            finish: undefined,
          } as ITask);
        } else {
          id = `${sAttr?.sequencenum}.${pAttr?.sequencenum}`;
          items.push({
            id,
            assignTo: undefined,
            title: pAttr?.title,
            book: pAttr?.book,
            ref: pAttr?.reference,
            status: pMap[pAttr?.state] ?? TaskStatus.Created,
            taskType: TaskType.Passage,
            comment: Array<Comment>(),
            start: Date.now(),
            finish: undefined,
          } as ITask);
        }
        addTasks(id, items);
      }
    });
    setItem(items);
  }, [passages, plan, plans, sections]);

  // const TaskItem = (props: any) => {
  //   return (
  //     <div {...props}>
  //       <span>{props.value.id}</span>
  //       <span>{props.value.title}</span>
  //       <span>{props.value.book || ''}</span>
  //       <span>{props.value.ref}</span>
  //     </div>
  //   );
  // };

  const field = (v: string | number, w: number) => {
    const val = `${v}`;
    const arr = createRange(w - val.length, () => '\u00A0');
    return val + arr.join('');
  };

  const values = (i: ITask) =>
    `${field(i.id, 5)} ${i.title} ${i.book || ''} ${i.ref || ''}`;

  return (
    <Sortable
      // renderItem={TaskItem}
      getItemStyles={getItemStyle}
      {...props}
      items={item.map((i) => values(i))}
      handle
      modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
    />
  );
};

const mapRecordsToProps = {
  plans: (q: QueryBuilder) => q.findRecords('plan'),
  sections: (q: QueryBuilder) => q.findRecords('section'),
  passages: (q: QueryBuilder) => q.findRecords('passage'),
  mediafiles: (q: QueryBuilder) => q.findRecords('mediafile'),
};

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'planTabs' }),
});

export default withData(mapRecordsToProps)(
  connect(mapStateToProps)(TaskList) as any
) as any;
