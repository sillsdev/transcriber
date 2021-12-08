import { useEffect, useState } from 'react';
import { IState, IWorkflowStepsStrings } from '../../model';
import localStrings from '../../selector/localize';
import { arrayMoveImmutable as arrayMove } from 'array-move';
import { useGlobal } from 'reactn';
import { TransformBuilder } from '@orbit/data';
import { StepItem, StepList } from '.';
import { useOrgWorkflowSteps } from '../../crud/useOrgWorkflowSteps';
import { shallowEqual, useSelector } from 'react-redux';
import { toCamel } from '../../utils';
import { useTools } from '../../crud';

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

const stringSelector = (state: IState) =>
  localStrings(state as IState, { layout: 'workflowSteps' });

export const StepEditor = ({ process, org }: IProps) => {
  const [rows, setRows] = useState<IStepRow[]>([]);
  const t: IWorkflowStepsStrings = useSelector(stringSelector, shallowEqual);
  const [memory] = useGlobal('memory');
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
    setRefresh(refresh + 1);
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

  const localName = (name: string) => {
    const lookUp = toCamel(name);
    return t.hasOwnProperty(lookUp) ? t.getString(lookUp) : name;
  };

  useEffect(() => {
    GetOrgWorkflowSteps(process || 'OBT', org).then((orgSteps) => {
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
      setRows(newRows.filter((r) => r.seq >= 0).sort((i, j) => i.seq - j.seq));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refresh]);

  return (
    <StepList onSortEnd={handleSortEnd} useDragHandle>
      {rows.map((value, index) => (
        <StepItem
          key={index}
          index={index}
          value={value}
          onNameChange={handleNameChange}
          onToolChange={handleToolChange}
          onDelete={handleDelete}
        />
      ))}
    </StepList>
  );
};
