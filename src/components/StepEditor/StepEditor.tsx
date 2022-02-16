import { useContext, useEffect, useMemo, useRef, useState } from 'react';
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
import { getTool, ToolSlug, defaultWorkflow } from '../../crud';
import { AddRecord } from '../../model/baseModel';
import { useSnackBar } from '../../hoc/SnackBar';
import { UnsavedContext } from '../../context/UnsavedContext';

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
  rIdx: number;
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
  const { toolChanged, toolsChanged, saveRequested, saveCompleted } =
    useContext(UnsavedContext).state;
  const { GetOrgWorkflowSteps } = useOrgWorkflowSteps();
  const { showMessage } = useSnackBar();
  const saving = useRef(false);
  const toolId = 'stepEditor';

  const mxSeq = useMemo(() => {
    let max = 0;
    rows.forEach((r) => {
      max = Math.max(r.seq, max);
    });
    return max;
  }, [rows]);

  const visible = useMemo(() => {
    return rows.filter((r) => r.seq >= 0).length;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);

  const hidden = useMemo(() => {
    return rows.filter((r) => r.seq < 0).length;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);

  const hiddenMessage = useMemo(
    () => se.stepsHidden.replace('{0}', hidden.toString()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hidden]
  );

  const getOrgNames = (exceptId?: string) => {
    return rows.filter((r) => r.id !== exceptId).map((r) => r.name);
  };

  const mangleName = (name: string, orgNames: string[], index?: number) => {
    const baseName = name;
    let count = 1;
    while (true) {
      const i = orgNames.indexOf(name);
      if (i < 0 || i === index) break;
      count += 1;
      name = `${baseName} ${count}`;
    }
    return name;
  };

  const handleSortEnd = ({ oldIndex, newIndex }: SortEndProps) => {
    let newRows = arrayMove(rows, oldIndex, newIndex).map((r, i) =>
      r.seq !== i ? { ...r, seq: i } : r
    );
    setRows(newRows);
    toolChanged(toolId, true);
  };

  const handleNameChange = (name: string, index: number) => {
    setRows(rows.map((r, i) => (i === index ? { ...r, name } : r)));
    toolChanged(toolId, true);
  };

  const handleToolChange = (tool: string, index: number) => {
    setRows(rows.map((r, i) => (i === index ? { ...r, tool } : r)));
    toolChanged(toolId, true);
  };

  const handleHide = (index: number) => {
    if (visible === 1) {
      showMessage(se.lastStep);
      return;
    }
    setRows(rows.map((r, i) => (i === index ? { ...r, seq: -1 } : r)));
    showMessage(se.oneHidden);
    toolChanged(toolId, true);
  };

  const handleVisible = async (index: number) => {
    setRows(rows.map((r, i) => (i === index ? { ...r, seq: mxSeq + 1 } : r)));
    showMessage(se.oneVisible);
    toolChanged(toolId, true);
  };

  const handleShow = () => {
    setShowALl(!showAll);
  };

  const handleAdd = async () => {
    let name = mangleName(se.nextStep, getOrgNames());
    const tool = ToolSlug.Discuss;
    setRows([
      ...rows,
      { id: '', name, tool, seq: mxSeq + 1, rIdx: rows.length },
    ]);
    showMessage(se.stepAdded);
    toolChanged(toolId, true);
  };

  const saveRecs = async () => {
    if (saving.current) return;
    saving.current = true;
    showMessage(se.saving);
    let orgNames = new Set<string>();
    let count = 0;
    for (let ix = 0; ix < rows.length; ix += 1) {
      const row = rows[ix];
      const id = row.id;
      if (id) {
        const recId = { type: 'orgworkflowstep', id };
        const rec = memory.cache.query((q: QueryBuilder) =>
          q.findRecord(recId)
        ) as OrgWorkflowStep | undefined;
        if (rec) {
          let name = rec.attributes?.name;
          if (name !== row.name) {
            name = mangleName(
              row.name,
              getOrgNames(id).concat(Array.from(orgNames))
            );
            orgNames.add(name);
          }
          const tool = JSON.stringify({ tool: row.tool });
          if (
            name !== rec.attributes?.name ||
            row.seq !== rec.attributes?.sequencenum ||
            tool !== rec.attributes?.tool
          ) {
            await memory.update((t: TransformBuilder) =>
              t.updateRecord({
                ...rec,
                attributes: {
                  ...rec.attributes,
                  name,
                  sequencenum: row.seq,
                  tool: JSON.stringify({ tool: row.tool }),
                },
              })
            );
            count += 1;
          }
        }
      } else {
        const name = mangleName(
          row.name,
          getOrgNames().concat(Array.from(orgNames)),
          ix
        );
        const tool = row.tool;
        const rec = {
          type: 'orgworkflowstep',
          attributes: {
            sequencenum: row.seq,
            name,
            process: process || defaultWorkflow,
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
        count += 1;
      }
    }
    showMessage(se.changes.replace('{0}', count.toString()));
    saving.current = false;
  };

  useEffect(() => {
    if (saveRequested(toolId)) saveRecs().then(() => saveCompleted(toolId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toolsChanged]);

  const localName = (name: string) => {
    const lookUp = toCamel(name);
    return t.hasOwnProperty(lookUp) ? t.getString(lookUp) : name;
  };

  useEffect(() => {
    GetOrgWorkflowSteps({ process: 'ANY', org, showAll }).then((orgSteps) => {
      const newRows = Array<IStepRow>();
      orgSteps.forEach((s) => {
        newRows.push({
          id: s.id,
          seq: s.attributes?.sequencenum,
          name: localName(s.attributes?.name),
          tool: toCamel(getTool(s.attributes?.tool)),
          rIdx: newRows.length,
        });
      });
      setRows(newRows.sort((i, j) => i.seq - j.seq));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        {rows
          .map((r, i) => ({ ...r, rIdx: i }))
          .filter((r) => r.seq >= 0 || showAll)
          .map((r) => (
            <StepItem
              key={`si-${r.rIdx}`}
              index={r.rIdx}
              value={r}
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
