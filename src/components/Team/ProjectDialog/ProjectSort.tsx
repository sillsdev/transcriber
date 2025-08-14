import React from 'react';
import { TeamContext } from '../../../context/TeamContext';
import { VertListDnd } from '../../../hoc/VertListDnd';
import { SortableItem } from './SortableItem';
import { arrayMoveImmutable as arrayMove } from 'array-move';
import {
  orgDefaultProjSort,
  useOrgDefaults,
} from '../../../crud/useOrgDefaults';
import { ISharedStrings, ProjectD } from '../../../model';
import related from '../../../crud/related';
import { findRecord } from '../../../crud/tryFindRecord';
import { useGlobal } from '../../../context/GlobalContext';
import { IconButton, Stack } from '@mui/material';
import ResetIcon from '@mui/icons-material/SettingsBackupRestore';
import { PriButton } from '../../StepEditor';
import { shallowEqual, useSelector } from 'react-redux';
import { sharedSelector } from '../../../selector';

export type SortArr = [string, number][];
export type SortMap = Map<string, number>;

export const mapKey = (p: ProjectD) => p.keys?.remoteId || p.id;
export const getKey = (p: ProjectD, map: SortMap) => map.get(mapKey(p));

interface IProps {
  teamId?: string; // Optional, if not provided, will use personal projects
  onClose?: () => void;
}

export function ProjectSort({ teamId, onClose }: IProps) {
  const { teamProjects, personalProjects, personalTeam, updateGeneralBooks } =
    React.useContext(TeamContext).state;
  const [, setBusy] = useGlobal('remoteBusy');
  const { getOrgDefault, setOrgDefault } = useOrgDefaults();
  const [sortKey, setSortKey] = React.useState<SortArr>([]);
  const defSort = React.useRef<SortArr>();
  const cancel = React.useRef(true);
  const [memory] = useGlobal('memory');
  const [projRecs, setProjRecs] = React.useState<ProjectD[]>([]);
  const mounted = React.useRef(false);
  const ts: ISharedStrings = useSelector(sharedSelector, shallowEqual);

  const getProj = (i: number) => {
    const projId = teamId
      ? related(teamProjects(teamId)[i], 'project')
      : related(personalProjects[i], 'project');
    return findRecord(memory, 'project', projId) as ProjectD;
  };

  const updateSortKey = (map: SortMap) => {
    const arr = Array.from(map.entries()).sort((a, b) => a[1] - b[1]);
    setSortKey(arr);
    setOrgDefault(orgDefaultProjSort, arr, teamId ?? personalTeam);
  };

  interface OnSortEndProps {
    oldIndex: number;
    newIndex: number;
  }

  const onSortEnd = ({ oldIndex, newIndex }: OnSortEndProps) => {
    if (oldIndex === newIndex) return;
    const indexes = projRecs.map((_, i) => i);
    const newIndexes = arrayMove(indexes, oldIndex, newIndex) as number[];
    const sortMap = new Map<string, number>(sortKey);
    for (let i = 0; i < newIndexes.length; i += 1) {
      const pRec = projRecs[newIndexes[i]];
      if (getKey(pRec, sortMap) !== i) {
        sortMap.set(mapKey(pRec), i);
      }
    }
    updateSortKey(sortMap);
    setProjRecs((prev) => arrayMove(prev, oldIndex, newIndex));
  };

  const handleSave = () => {
    setBusy(true);
    cancel.current = false;
    updateGeneralBooks(sortKey).finally(() => {
      setBusy(false);
      onClose?.();
    });
  };

  const resetSort = () => {
    cancel.current = false;
    setOrgDefault(orgDefaultProjSort, undefined, teamId ?? personalTeam);
    onClose?.();
  };

  React.useEffect(() => {
    if (!mounted.current) {
      let sortOrder =
        (getOrgDefault(orgDefaultProjSort, teamId ?? personalTeam) as
          | SortArr
          | undefined) || [];
      if (!Array.isArray(sortOrder)) sortOrder = [];
      defSort.current = sortOrder.map((i) => [i[0], i[1]]);
      const projects = teamId ? teamProjects(teamId) : personalProjects;
      const projRecs = projects.map((_, i) => getProj(i));
      const sortMap = new Map<string, number>(sortOrder);
      for (let i = 0; i < projRecs.length; i += 1) {
        if (getKey(projRecs[i], sortMap) !== i) {
          sortMap.set(mapKey(projRecs[i]), i);
        }
      }
      updateSortKey(sortMap);
      setProjRecs(projRecs);
      mounted.current = true;
    }

    return () => {
      if (cancel.current) {
        setOrgDefault(
          orgDefaultProjSort,
          defSort.current,
          teamId ?? personalTeam
        );
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Stack>
      <Stack direction="row" justifyContent="right" sx={{ mb: 2 }}>
        <IconButton sx={{ alignSelf: 'flex-end' }} onClick={resetSort}>
          <ResetIcon />
        </IconButton>
        <PriButton onClick={handleSave} sx={{ alignSelf: 'flex-end' }}>
          {ts.save}
        </PriButton>
      </Stack>
      <VertListDnd onDrop={onSortEnd} dragHandle>
        {projRecs.map((value) => (
          <SortableItem key={`item-${value.id}`} value={value} />
        ))}
      </VertListDnd>
    </Stack>
  );
}
