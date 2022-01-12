import { useEffect, useMemo, useRef, useState } from 'react';
import {
  IStepEditorStrings,
  IState,
  IWorkflowStepsStrings,
  OrgWorkflowStep,
} from '../../model';
import { Button, makeStyles } from '@material-ui/core';
import localStrings from '../../selector/localize';
import { arrayMoveImmutable as arrayMove } from 'array-move';
import { useGlobal } from 'reactn';
import { QueryBuilder, TransformBuilder } from '@orbit/data';
import { StepItem, StepList } from '.';
import { useOrgWorkflowSteps } from '../../crud/useOrgWorkflowSteps';
import { CheckedChoice as ShowAll } from '../../control';
import { shallowEqual, useSelector } from 'react-redux';
import { toCamel, useRemoteSave } from '../../utils';
import { related, ToolSlug, useTools } from '../../crud';
import { AddRecord } from '../../model/baseModel';
import { useSnackBar } from '../../hoc/SnackBar';

const useStyles = makeStyles({
  row: {
    display: 'flex',
    justifyContent: 'space-between',
  },
});

export interface IStepRow {
  id: string;
  seq: number;
  name: string;
  tool: string;
}

interface SortEndProps {
  oldIndex: number;
  newIndex: number;
}

interface IProps {
  process?: string;
  org?: string;
}

const wfStepsSelector = (state: IState) =>
  localStrings(state as IState, { layout: 'workflowSteps' });
export const stepEditorSelector = (state: IState) =>
  localStrings(state as IState, { layout: 'stepEditor' });

export const StepEditor = ({ process, org }: IProps) => {
  const classes = useStyles();
  const [rows, setRows] = useState<IStepRow[]>([]);
  const [showAll, setShowALl] = useState(false);
  const t: IWorkflowStepsStrings = useSelector(wfStepsSelector, shallowEqual);
  const se: IStepEditorStrings = useSelector(stepEditorSelector, shallowEqual);
  const [memory] = useGlobal('memory');
  const [user] = useGlobal('user');
  const [changed, setChanged] = useGlobal('changed');
  const [doSave] = useGlobal('doSave');
  const [, saveCompleted] = useRemoteSave();
  const { GetOrgWorkflowSteps } = useOrgWorkflowSteps();
  const { mapTool } = useTools();
  const [refresh, setRefresh] = useState(0);
  const { showMessage } = useSnackBar();
  const changeList = useRef(new Set<string>());
  const adding = useRef(false);

  const handleSortEnd = ({ oldIndex, newIndex }: SortEndProps) => {
    const newRows = arrayMove(rows, oldIndex, newIndex);
    newRows
      .filter((r) => r.seq >= 0)
      .forEach((r, i) => {
        if (r.seq !== i) {
          const recId = { type: 'orgworkflowstep', id: r.id };
          memory.update((t: TransformBuilder) =>
            t.replaceAttribute(recId, 'sequencenum', i)
          );
        }
      });
    setRows(newRows);
  };

  const handleNameChange = async (id: string, name: string) => {
    setRows(rows.map((r) => (r.id === id ? { ...r, name } : r)));
    if (!changed) setChanged(true);
    changeList.current.add(id);
  };

  const getOrgNames = (exceptId?: string) => {
    const names = (
      memory.cache.query((q: QueryBuilder) =>
        q.findRecords('orgworkflowstep')
      ) as OrgWorkflowStep[]
    )
      .filter((r) => related(r, 'organization') === org && r.id !== exceptId)
      .map((r) => r.attributes?.name);
    return names;
  };

  const mangleName = (name: string, orgNames: string[]) => {
    const baseName = name;
    let count = 1;
    while (orgNames.indexOf(name) >= 0) {
      count += 1;
      name = `${baseName} ${count}`;
    }
    return name;
  };

  const saveRecs = async () => {
    if (changed) showMessage(se.saving);
    let orgNames = new Set<string>();
    for (const id of Array.from(changeList.current)) {
      const row = rows.find((r) => r.id === id);
      const recId = { type: 'orgworkflowstep', id };
      const rec = memory.cache.query((q: QueryBuilder) =>
        q.findRecord(recId)
      ) as OrgWorkflowStep | undefined;
      if (rec && row) {
        const recName = rec.attributes?.name;
        if (recName !== row.name) {
          const name = mangleName(
            row.name,
            getOrgNames(id).concat(Array.from(orgNames))
          );
          await memory.update((t: TransformBuilder) =>
            t.replaceAttribute(recId, 'name', name)
          );
          orgNames.add(name);
        }
      }
    }
  };

  useEffect(() => {
    saveRecs().then(() => saveCompleted(''));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doSave]);

  const handleToolChange = async (id: string, tool: string) => {
    const recId = { type: 'orgworkflowstep', id };
    await memory.update((t: TransformBuilder) =>
      t.replaceAttribute(recId, 'tool', JSON.stringify({ tool }))
    );
    setRefresh(refresh + 1);
  };

  const visible = useMemo(() => {
    const recs = memory.cache.query((q: QueryBuilder) =>
      q.findRecords('orgworkflowstep')
    ) as OrgWorkflowStep[];
    return recs.filter(
      (r) => related(r, 'organization') === org && r.attributes.sequencenum >= 0
    ).length;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [org, refresh]);

  const handleHide = async (id: string) => {
    if (visible === 1) {
      showMessage(se.lastStep);
      return;
    }
    const recId = { type: 'orgworkflowstep', id };
    await memory.update((t: TransformBuilder) =>
      t.replaceAttribute(recId, 'sequencenum', -1)
    );
    showMessage(se.oneHidden);
    setRefresh(refresh + 1);
  };

  const handleVisible = async (id: string) => {
    const recId = { type: 'orgworkflowstep', id };
    await memory.update((t: TransformBuilder) =>
      t.replaceAttribute(recId, 'sequencenum', rows.length)
    );
    showMessage(se.oneVisible);
    setRefresh(refresh + 1);
  };

  const handleAdd = async () => {
    let name = mangleName(se.nextStep, getOrgNames());
    if (adding.current) {
      showMessage(se.inProgress);
      return;
    }
    adding.current = true;
    const tool = ToolSlug.Discuss;
    const rec = {
      type: 'orgworkflowstep',
      attributes: {
        sequencenum: rows.length,
        name,
        process: process || 'OBT',
        tool: JSON.stringify({ tool }),
        permissions: '{}',
      },
    } as OrgWorkflowStep;
    if (org) {
      const orgRec = { type: 'organization', id: org };
      await memory.update((t: TransformBuilder) => [
        ...AddRecord(t, rec, user, memory),
        t.replaceRelatedRecord(rec, 'organization', orgRec),
      ]);
    }
    showMessage(se.stepAdded);
    adding.current = false;
    setRefresh(refresh + 1);
  };

  const localName = (name: string) => {
    const lookUp = toCamel(name);
    return t.hasOwnProperty(lookUp) ? t.getString(lookUp) : name;
  };

  const handleShow = () => {
    setShowALl(!showAll);
    setRefresh(refresh + 1);
  };

  useEffect(() => {
    GetOrgWorkflowSteps({ process: 'ANY', org, showAll }).then((orgSteps) => {
      const newRows = Array<IStepRow>();
      orgSteps.forEach((s) => {
        const tools = JSON.parse(s.attributes?.tool);
        newRows.push({
          id: s.id,
          seq: s.attributes?.sequencenum,
          name: localName(s.attributes?.name),
          tool: mapTool(toCamel(tools.tool)),
        });
      });
      setRows(newRows.sort((i, j) => i.seq - j.seq));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refresh]);

  const hidden = useMemo(() => {
    const recs = memory.cache.query((q: QueryBuilder) =>
      q.findRecords('orgworkflowstep')
    ) as OrgWorkflowStep[];
    return recs.filter(
      (r) => related(r, 'organization') === org && r.attributes.sequencenum < 0
    ).length;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [org, refresh]);

  const hiddenMessage = useMemo(
    () => se.stepsHidden.replace('{0}', hidden.toString()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hidden]
  );

  return (
    <div>
      <div className={classes.row}>
        <Button
          onClick={handleAdd}
          variant="contained"
          disabled={adding.current}
        >
          {se.add}
        </Button>
        <div title={hiddenMessage}>
          <ShowAll
            label={se.showAll}
            value={showAll}
            onChange={handleShow}
            disabled={hidden === 0}
          />
        </div>
      </div>
      <StepList onSortEnd={handleSortEnd} useDragHandle>
        {rows.map((value, index) => (
          <StepItem
            key={index}
            index={index}
            value={value}
            onNameChange={handleNameChange}
            onToolChange={handleToolChange}
            onDelete={handleHide}
            onRestore={handleVisible}
          />
        ))}
      </StepList>
    </div>
  );
};
