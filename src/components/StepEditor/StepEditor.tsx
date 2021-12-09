import { useEffect, useMemo, useState } from 'react';
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
import { toCamel } from '../../utils';
import { related, useTools } from '../../crud';
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
  const { GetOrgWorkflowSteps } = useOrgWorkflowSteps();
  const { mapTool } = useTools();
  const [refresh, setRefresh] = useState(0);
  const { showMessage } = useSnackBar();

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

  const countName = (name: string) => {
    const recs = memory.cache.query((q: QueryBuilder) =>
      q.findRecords('orgworkflowstep')
    ) as OrgWorkflowStep[];
    return recs.filter(
      (r) =>
        related(r, 'organization') === org &&
        r.attributes?.name?.startsWith(name) &&
        / [0-9]+/.test(r.attributes?.name?.slice(name.length))
    ).length;
  };

  const handleNameChange = async (id: string, name: string) => {
    const count = countName(name);
    if (count > 0) {
      name = `${name} ${count + 1}`;
    }
    const recId = { type: 'orgworkflowstep', id };
    await memory.update((t: TransformBuilder) =>
      t.replaceAttribute(recId, 'name', name)
    );
    setRows(rows.map((r) => (r.id === id ? { ...r, name } : r)));
  };
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
    let name = se.nextStep;
    const count = countName(name);
    if (count > 0) {
      name = `${name} ${count + 1}`;
    }
    const tool = 'discuss';
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
    GetOrgWorkflowSteps({ process: process || 'OBT', org, showAll }).then(
      (orgSteps) => {
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
      }
    );
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
        <Button onClick={handleAdd} variant="contained">
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
