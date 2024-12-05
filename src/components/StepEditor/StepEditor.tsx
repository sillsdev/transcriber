import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  IStepEditorStrings,
  IState,
  OrgWorkflowStep,
  IWorkflowStepsStrings,
  OrgWorkflowStepD,
} from '../../model';
import { Button, Box } from '@mui/material';
import localStrings from '../../selector/localize';
import { arrayMoveImmutable as arrayMove } from 'array-move';
import { useGlobal } from 'reactn';
import { StepItem } from '.';
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
import { ParatextStepSettings } from './ParatextStepSettings';
import { workflowStepsSelector } from '../../selector';
import { RecordKeyMap } from '@orbit/records';
import { VertListDnd } from '../../hoc/VertListDnd';
import { DiscussStepSettings } from './DiscussStepSettings';

export interface IStepRow {
  id: string;
  seq: number;
  name: string;
  pos: number;
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
  org: string;
}

export const stepEditorSelector = (state: IState) =>
  localStrings(state as IState, { layout: 'stepEditor' });

export const StepEditor = ({ process, org }: IProps) => {
  const [sortKey, setSortKey] = useState(0);
  const [rows, setRows] = useState<IStepRow[]>([]);
  const [showAll, setShowAll] = useState(false);
  const se: IStepEditorStrings = useSelector(stepEditorSelector, shallowEqual);
  const st: IWorkflowStepsStrings = useSelector(
    workflowStepsSelector,
    shallowEqual
  );
  const [memory] = useGlobal('memory');
  const [user] = useGlobal('user');
  const {
    isChanged,
    toolChanged,
    toolsChanged,
    saveRequested,
    saveCompleted,
    clearRequested,
    clearCompleted,
  } = useContext(UnsavedContext).state;
  const { GetOrgWorkflowSteps, localizedWorkStep } = useOrgWorkflowSteps();
  const { showMessage } = useSnackBar();
  const saving = useRef(false);
  const toolId = 'stepEditor';
  const { localizedTool } = useTools();
  const { localizedArtifactTypeFromId, slugFromId } = useArtifactType();
  const [toolSettingsRow, setToolSettingsRow] = useState(-1);
  const toolRef = useRef<number>();
  const focusIndex = useRef<number>(0);
  const settingsTools = [
    ToolSlug.Transcribe,
    ToolSlug.Paratext,
    ToolSlug.Discuss,
  ];
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

  const mangleName = (
    name: string,
    orgNames: string[],
    index?: number,
    mangleTranscribe: boolean = true
  ) => {
    if (mangleTranscribe) {
      const hasTranscribe =
        name === st.transcribe &&
        rows.some((r, i) => {
          const settings = r.settings ? JSON.parse(r.settings) : undefined;
          if (!settings) return r.tool === ToolSlug.Transcribe && i !== index;
          return false;
        });
      name = hasTranscribe ? st.review : name;
    }
    let baseName = name;
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
    if (oldIndex === newIndex) return;
    setToolSettingsRow(-1);
    const filteredRows = rows.filter((r) => r.seq < 0 && !showAll);
    const unFilteredRows = rows.filter((r) => r.seq >= 0 || showAll);
    let newRows = filteredRows.concat(
      arrayMove(unFilteredRows, oldIndex, newIndex).map((r, i) => ({
        ...r,
        seq: i,
      }))
    );
    setRows(newRows);
    toolChanged(toolId, true);
  };

  const handleNameChange = (name: string, pos: number, index: number) => {
    focusIndex.current = index;
    setRows(rows.map((r, i) => (i === index ? { ...r, name, pos } : r)));
    if (!isChanged(toolId)) toolChanged(toolId, true);
  };

  const setToolSettingsOpen = (open: boolean) => {
    if (!open) setToolSettingsRow(-1);
    if (toolRef.current) {
      const settings = rows[toolRef.current].settings
        ? JSON.parse(rows[toolRef.current].settings)
        : {};
      const artId =
        remoteIdGuid(
          'artifacttype',
          settings?.artifactTypeId,
          memory.keyMap as RecordKeyMap
        ) ?? settings?.artifactTypeId;
      const artSlug = slugFromId(artId);
      const artShortName = artId
        ? ` ${
            se.hasOwnProperty(artSlug)
              ? se.getString(artSlug)
              : localizedArtifactTypeFromId(artId)
          }`
        : '';
      const lang = settings?.language
        ? ` ${settings.language?.split('|')[0]}`
        : '';
      let name =
        localizedTool(rows[toolRef.current].tool) + lang + artShortName;
      name = mangleName(name, getOrgNames(), toolRef.current);
      setRows(
        rows.map((r, i) =>
          i === toolRef.current
            ? {
                ...r,
                name,
              }
            : r
        )
      );
      toolRef.current = undefined;
    }
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
    if (settingsTools.includes(tool as ToolSlug)) toolRef.current = index;
    setToolSettingsRow(index); //bring up Settings editor
    let name = rows[index].name;
    if (name.includes(se.nextStep))
      name = mangleName(localizedTool(tool), getOrgNames());
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
    setRows((rows) =>
      rows.map((r, i) => (i === index ? { ...r, seq: -1 } : r))
    );
    showMessage(se.oneHidden);
    toolChanged(toolId, true);
  };

  const handleVisible = async (index: number) => {
    setRows((rows) =>
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
        pos: 0,
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
      const tool = JSON.stringify({
        tool: row.tool,
        settings: row.settings,
      });
      if (id) {
        const recId = { type: 'orgworkflowstep', id };
        const rec = memory.cache.query((q) => q.findRecord(recId)) as
          | OrgWorkflowStep
          | undefined;

        if (rec) {
          let name = rec.attributes?.name;
          if (name !== row.name) {
            name = mangleName(
              row.name,
              getOrgNames(id).concat(Array.from(orgNames)),
              ix,
              false
            );
            orgNames.add(name);
          }
          if (
            name !== rec.attributes?.name ||
            row.seq !== rec.attributes?.sequencenum ||
            tool !== rec.attributes?.tool
          ) {
            await memory.update((t) =>
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
          ix,
          false
        );
        const rec = {
          type: 'orgworkflowstep',
          attributes: {
            sequencenum: row.seq,
            name,
            process: process || defaultWorkflow,
            tool: tool,
            permissions: '{}',
          },
        } as OrgWorkflowStep;
        if (org) {
          await memory.update((t) => [
            ...AddRecord(t, rec, user, memory),
            ...ReplaceRelatedRecord(
              t,
              rec as OrgWorkflowStepD,
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
    else if (clearRequested(toolId)) clearCompleted(toolId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toolsChanged]);

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
            name: localizedWorkStep(s.attributes?.name),
            pos: 0,
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
  }, [org]);

  useEffect(() => {
    setSortKey((sortKey) => sortKey + 1);
  }, [rows, showAll]);

  const prettySettings = (tool: string, settings: string) => {
    var json = settings ? JSON.parse(settings) : undefined;
    switch (tool as ToolSlug) {
      case ToolSlug.Transcribe:
      case ToolSlug.Paratext:
        if (json)
          return localizedArtifactTypeFromId(
            remoteIdGuid(
              'artifacttype',
              json.artifactTypeId,
              memory.keyMap as RecordKeyMap
            ) ?? json.artifactTypeId
          );
        return localizedArtifactTypeFromId(VernacularTag);
      default:
        return '';
    }
  };

  return (
    <div>
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
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
      </Box>
      <VertListDnd key={`sort-${sortKey}`} onDrop={handleSortEnd} dragHandle>
        {rows
          .map((r, i) => ({ ...r, rIdx: i }))
          .filter((r) => r.seq >= 0 || showAll)
          .map((r, i) => ({ ...r, seq: i }))
          .map((r) => (
            <StepItem
              key={`si-${r.rIdx}`}
              index={r.rIdx}
              value={r}
              isFocused={focusIndex.current === r.rIdx}
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
      </VertListDnd>
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
      {toolSettingsRow > -1 && (
        <BigDialog
          title={localizedTool(rows[toolSettingsRow].tool)}
          isOpen={rows[toolSettingsRow].tool === ToolSlug.Paratext}
          onOpen={setToolSettingsOpen}
          bp={BigDialogBp.sm}
        >
          <ParatextStepSettings
            toolSettings={rows[toolSettingsRow].settings}
            onChange={handleSettingsChange}
          />
        </BigDialog>
      )}
      {toolSettingsRow > -1 && (
        <BigDialog
          title={localizedTool(rows[toolSettingsRow].tool)}
          isOpen={rows[toolSettingsRow].tool === ToolSlug.Discuss}
          onOpen={setToolSettingsOpen}
          bp={BigDialogBp.sm}
        >
          <DiscussStepSettings
            toolSettings={rows[toolSettingsRow].settings}
            onChange={handleSettingsChange}
            onClose={() => setToolSettingsOpen(false)}
          />
        </BigDialog>
      )}
    </div>
  );
};
