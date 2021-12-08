import { useEffect, useState } from 'react';
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
import { TransformBuilder } from '@orbit/data';
import { ShowAll, StepItem, StepList } from '.';
import { useOrgWorkflowSteps } from '../../crud/useOrgWorkflowSteps';
import { shallowEqual, useSelector } from 'react-redux';
import { toCamel } from '../../utils';
import { useTools } from '../../crud';
import { AddRecord } from '../../model/baseModel';

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
const stepEditorSelector = (state: IState) =>
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
  const handleDelete = async (id: string) => {
    const recId = { type: 'orgworkflowstep', id };
    await memory.update((t: TransformBuilder) =>
      t.replaceAttribute(recId, 'sequencenum', -1)
    );
    setRefresh(refresh + 1);
  };
  const handleRestore = async (id: string) => {
    const recId = { type: 'orgworkflowstep', id };
    await memory.update((t: TransformBuilder) =>
      t.replaceAttribute(recId, 'sequencenum', rows.length)
    );
    setRefresh(refresh + 1);
  };
  const handleAdd = async () => {
    const tool = 'discuss';
    const rec = {
      type: 'orgworkflowstep',
      attributes: {
        sequencenum: rows.length,
        name: se.nextStep,
        process: process || 'OBT',
        tool: JSON.stringify({ tool }),
      },
    } as OrgWorkflowStep;
    if (org) {
      const orgRec = { type: 'organization', id: org };
      await memory.update((t: TransformBuilder) => [
        ...AddRecord(t, rec, user, memory),
        t.replaceRelatedRecord(rec, 'organization', orgRec),
      ]);
    }
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

  return (
    <div>
      <div className={classes.row}>
        <Button onClick={handleAdd} variant="contained">
          {se.add}
        </Button>
        <ShowAll label={se.showAll} value={showAll} onChange={handleShow} />
      </div>
      <StepList onSortEnd={handleSortEnd} useDragHandle>
        {rows.map((value, index) => (
          <StepItem
            key={index}
            index={index}
            value={value}
            onNameChange={handleNameChange}
            onToolChange={handleToolChange}
            onDelete={handleDelete}
            onRestore={handleRestore}
          />
        ))}
      </StepList>
    </div>
  );
};
