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
import { IconButton, Stack } from '@mui/material';
import ResetIcon from '@mui/icons-material/SettingsBackupRestore';

interface IProps {
  teamId: string;
  onClose?: () => void;
}

export function ProjectSort({ teamId, onClose }: IProps) {
  const { teamProjects } = React.useContext(TeamContext).state;
  const { getProjectDefault, setProjectDefault } = useProjectDefaults();
  const [memory] = useGlobal('memory');
  const [projRecs, setProjRecs] = React.useState<ProjectD[]>([]);

  const getProj = (i: number) => {
    const projId = related(teamProjects(teamId)[i], 'project');
    return findRecord(memory, 'project', projId) as ProjectD;
  };

  const getKey = (p: ProjectD) =>
    parseInt(getProjectDefault(projDefSort, p) || '-1', 10);

  interface OnSortEndProps {
    oldIndex: number;
    newIndex: number;
  }

  const onSortEnd = ({ oldIndex, newIndex }: OnSortEndProps) => {
    if (oldIndex === newIndex) return;
    const indexes = projRecs.map((_, i) => i);
    const newIndexes = arrayMove(indexes, oldIndex, newIndex) as number[];
    for (let i = 0; i < newIndexes.length; i += 1) {
      const pRec = projRecs[newIndexes[i]];
      if (getKey(pRec) !== i) {
        setProjectDefault(projDefSort, pad3(i), pRec);
      }
    }
    setProjRecs((prev) => arrayMove(prev, oldIndex, newIndex));
  };

  const resetSort = () => {
    for (let i = 0; i < projRecs.length; i += 1) {
      setProjectDefault(projDefSort, undefined, projRecs[i]);
    }
    onClose?.();
  };

  React.useEffect(() => {
    const projRecs = teamProjects(teamId).map((_, i) => getProj(i));
    for (let i = 0; i < projRecs.length; i += 1) {
      if (getKey(projRecs[i]) !== i) {
        setProjectDefault(projDefSort, pad3(i), projRecs[i]);
      }
    }
    setProjRecs(projRecs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Stack>
      <IconButton sx={{ alignSelf: 'flex-end' }} onClick={resetSort}>
        <ResetIcon />
      </IconButton>
      <VertListDnd onDrop={onSortEnd} dragHandle>
        {projRecs.map((value) => (
          <SortableItem key={`item-${value.id}`} value={value} />
        ))}
      </VertListDnd>
    </Stack>
  );
}
