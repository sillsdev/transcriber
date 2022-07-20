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
import {
  getTool,
  ToolSlug,
  defaultWorkflow,
  useTools,
  useArtifactType,
  VernacularTag,
  getToolSettings,
  remoteIdGuid,
} from '../../crud';
import { AddRecord, ReplaceRelatedRecord } from '../../model/baseModel';
import { useSnackBar } from '../../hoc/SnackBar';
import { UnsavedContext } from '../../context/UnsavedContext';
import BigDialog, { BigDialogBp } from '../../hoc/BigDialog';
import { TranscribeStepSettings } from './TranscribeStepSettings';

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
  settings: string;
  prettySettings: string;
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
  const [showAll, setShowAll] = useState(false);
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
  const { localizedTool } = useTools();
  const { localizedArtifactTypeFromId } = useArtifactType();
  const [toolSettingsRow, setToolSettingsRow] = useState(-1);
  const settingsTools = [ToolSlug.Transcribe];
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
  const setToolSettingsOpen = (open: boolean) => {
    if (!open) setToolSettingsRow(-1);
  };
  const handleSettingsChange = (settings: string) => {
    setRows(
      rows.map((r, i) =>
        i === toolSettingsRow
          ? { ...r, settings, prettySettings: prettySettings(r.tool, settings) }
          : r
      )
    );
    toolChanged(toolId, true);
  };
  const handleToolChange = (tool: string, index: number) => {
    let name = rows[index].name;
    if (name.includes(se.nextStep))
      name = mangleName(localizedTool(tool), getOrgNames());
    //bring up Settings editor
    setToolSettingsRow(index);
    setRows(
      rows.map((r, i) =>
        i === index
          ? {
              ...r,
              tool,
              settings: '',
              prettySettings: prettySettings(tool, ''),
              name,
            }
          : r
      )
    );
    toolChanged(toolId, true);
  };

  const handleSettings = (index: number) => {
    setToolSettingsRow(index);
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
    setRows(
      rows
        .map((r, i) => (i === index ? { ...r, seq: mxSeq + 1 } : r))
        .sort((i, j) => i.seq - j.seq)
    );
    showMessage(se.oneVisible);
    toolChanged(toolId, true);
  };

  const handleShow = () => {
    setShowAll(!showAll);
  };

  const handleAdd = async () => {
    let name = mangleName(se.nextStep, getOrgNames());
    const tool = ToolSlug.Discuss;
    setRows([
      ...rows,
      {
        id: '',
        name,
        tool,
        settings: '',
        prettySettings: prettySettings(tool, ''),
        seq: mxSeq + 1,
        rIdx: rows.length,
      },
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
          const tool = JSON.stringify({
            tool: row.tool,
            settings: row.settings,
          });
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
                  tool: tool,
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
          await memory.update((t: TransformBuilder) => [
            ...AddRecord(t, rec, user, memory),
            ...ReplaceRelatedRecord(
              t,
              rec,
              'organization',
              'organization',
              org
            ),
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
    GetOrgWorkflowSteps({ process: 'ANY', org, showAll: true }).then(
      (orgSteps) => {
        const newRows = Array<IStepRow>();
        orgSteps.forEach((s) => {
          var tool = getTool(s.attributes?.tool);
          var settings = getToolSettings(s.attributes?.tool);
          newRows.push({
            id: s.id,
            seq: s.attributes?.sequencenum,
            name: localName(s.attributes?.name),
            tool: toCamel(tool),
            settings: settings,
            prettySettings: prettySettings(tool, settings),
            rIdx: newRows.length,
          });
        });
        setRows(newRows.sort((i, j) => i.seq - j.seq));
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const prettySettings = (tool: string, settings: string) => {
    var json = settings ? JSON.parse(settings) : undefined;
    switch (tool as ToolSlug) {
      case ToolSlug.Transcribe:
        if (json)
          return localizedArtifactTypeFromId(
            remoteIdGuid('artifacttype', json.artifactTypeId, memory.keyMap)
          );
        return localizedArtifactTypeFromId(VernacularTag);
      default:
        return '';
    }
  };
  return (
    <div>
      <div className={classes.row}>
        <Button id="wk-step-add" onClick={handleAdd} variant="contained">
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
              onSettings={
                settingsTools.includes(r.tool as ToolSlug)
                  ? handleSettings
                  : undefined
              }
              settingsTitle={r.prettySettings}
            />
          ))}
      </StepList>
      {toolSettingsRow > -1 && (
        <BigDialog
          title={localizedTool(rows[toolSettingsRow].tool)}
          isOpen={rows[toolSettingsRow].tool === ToolSlug.Transcribe}
          onOpen={setToolSettingsOpen}
          bp={BigDialogBp.sm}
        >
          <TranscribeStepSettings
            toolSettings={rows[toolSettingsRow].settings}
            onChange={handleSettingsChange}
          />
        </BigDialog>
      )}
    </div>
  );
};
