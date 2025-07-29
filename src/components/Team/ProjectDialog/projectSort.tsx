import React from 'react';
import { TeamContext } from '../../../context/TeamContext';
import { VertListDnd } from '../../../hoc/VertListDnd';
import { SortableItem } from './SortableItem';
import { arrayMoveImmutable as arrayMove } from 'array-move';
import {
  projDefSort,
  useProjectDefaults,
} from '../../../crud/useProjectDefaults';
import { ProjectD } from '../../../model';
import related from '../../../crud/related';
import { findRecord } from '../../../crud/tryFindRecord';
import { useGlobal } from '../../../context/GlobalContext';
import { pad3 } from '../../../utils/pad3';

interface IProps {
  teamId: string;
}

export function ProjectSort({ teamId }: IProps) {
  const { teamProjects } = React.useContext(TeamContext).state;
  const { getProjectDefault, setProjectDefault } = useProjectDefaults();
  const [memory] = useGlobal('memory');
  const [snapshot, setSnapshot] = React.useState(0);

  const projMap = new Map<number, ProjectD>();

  const getProj = (i: number) => {
    if (projMap.has(i)) return projMap.get(i);
    const projId = related(teamProjects(teamId)[i], 'project');
    const projRec = findRecord(memory, 'project', projId) as ProjectD;
    projMap.set(i, projRec);
    return projRec;
  };

  const onSortEnd = ({
    oldIndex,
    newIndex,
  }: {
    oldIndex: number;
    newIndex: number;
  }) => {
    if (oldIndex === newIndex) return;
    const indexes = teamProjects(teamId).map((_, i) => i);
    const newIndexes = arrayMove(indexes, oldIndex, newIndex) as number[];
    for (let i = 0; i < newIndexes.length; i += 1) {
      const curSort = parseInt(
        getProjectDefault(projDefSort, getProj(i)) || '0',
        10
      );
      if (curSort !== newIndexes[i]) {
        setProjectDefault(projDefSort, pad3(newIndexes[i]), getProj(i));
      }
    }
    setSnapshot((s) => s + 1);
  };

  return (
    <VertListDnd key={`sort-${snapshot}`} onDrop={onSortEnd} dragHandle>
      {teamProjects(teamId).map((value, index) => (
        <SortableItem key={`item-${index}`} value={value} />
      ))}
    </VertListDnd>
  );
}
