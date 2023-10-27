import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useGlobal } from 'reactn';
import { withData } from 'react-orbitjs';
import { QueryBuilder } from '@orbit/data';
import Confirm from '../AlertDialog';
import {
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  LinearProgress,
} from '@mui/material';
import {
  Organization,
  IDialog,
  DialogMode,
  OptionType,
  WorkflowStep,
  Project,
  Plan,
} from '../../model';
import DeleteExpansion from '../DeleteExpansion';
import { TeamContext } from '../../context/TeamContext';
import { defaultWorkflow, related } from '../../crud';
import PublishExpansion from '../PublishExpansion';
import { UnsavedContext } from '../../context/UnsavedContext';
import { waitForIt } from '../../utils';

interface IRecordProps {
  organizations: Array<Organization>;
  projects: Array<Project>;
  plans: Array<Plan>;
}
export interface ITeamDialog {
  team: Organization;
  process?: string;
  bibleMediafile: string;
  isoMediafile: string;
}
interface IProps extends IRecordProps, IDialog<ITeamDialog> {
  onDelete?: (team: Organization) => void;
}
export function TeamDialog(props: IProps) {
  const {
    mode,
    values,
    isOpen,
    organizations,
    projects,
    plans,
    onOpen,
    onCommit,
    onDelete,
  } = props;
  const [name, setName] = React.useState('');
  const [iso, setIso] = React.useState('');
  const [bibleId, setBibleId] = React.useState('');
  const [bibleName, setBibleName] = React.useState('');
  const [defaultParams, setDefaultParams] = React.useState('');
  const bibleMediafileRef = useRef('');
  const isoMediafileRef = useRef('');
  const [publishingData, setPublishingData] = React.useState('{}');
  const [changed, setChanged] = React.useState(false);
  const ctx = React.useContext(TeamContext);
  const { cardStrings } = ctx.state;
  const t = cardStrings;
  const [memory] = useGlobal('memory');
  const [process, setProcess] = useState<string>();
  const [processOptions, setProcessOptions] = useState<OptionType[]>([]);
  const savingRef = useRef(false);
  const [saving, setSavingx] = useState(false);
  const [confirm, setConfirm] = React.useState(false);
  const { anySaving, toolsChanged, startSave, clearRequested } =
    useContext(UnsavedContext).state;

  const reset = () => {
    setName('');
    setDefaultParams('');
    setChanged(false);
    setProcess(undefined);
    setSaving(false);
    setConfirm(false);
    onOpen && onOpen(false);
    Object.keys(toolsChanged).forEach((t) => clearRequested(t));
  };
  const handleClose = () => {
    if (changed) {
      setConfirm(true);
    } else reset();
  };
  const dontDoIt = () => {
    setConfirm(false);
  };
  const setSaving = (saving: boolean) => {
    setSavingx(saving);
    savingRef.current = saving;
  };
  const setBibleMediafile = (value: string) => {
    bibleMediafileRef.current = value;
  };
  const setIsoMediafile = (value: string) => {
    isoMediafileRef.current = value;
  };
  const handleCommit = (process: string | undefined) => async () => {
    if (savingRef.current) return;
    setSaving(true);
    Object.keys(toolsChanged).forEach((t) => startSave(t));

    waitForIt(
      'anySaving',
      () => !anySaving(),
      () => false,
      10000
    ).finally(() => {
      const current =
        mode === DialogMode.edit && values
          ? values.team
          : ({ attributes: {} } as Organization);
      const team = {
        ...current,
        attributes: {
          ...current.attributes,
          name,
          iso,
          bibleId,
          bibleName,
          defaultParams,
          publishingData,
        },
      } as Organization;
      onCommit(
        {
          team,
          bibleMediafile: bibleMediafileRef.current,
          isoMediafile: isoMediafileRef.current,
          process: process || defaultWorkflow,
        },
        async (id: string) => {
          reset();
        }
      );
    });
  };
  const setValue = (what: string, value: string) => {
    switch (what) {
      case 'iso':
        setIso(value);
        break;
      case 'bibleId':
        setBibleId(value);
        break;
      case 'bibleName':
        setBibleName(value);
        break;
      case 'defaultParams':
        setDefaultParams(value);
        break;
      case 'bibleMediafile':
        setBibleMediafile(value);
        break;
      case 'isoMediafile':
        setIsoMediafile(value);
        break;
      case 'publishingData':
        setPublishingData(value);
        break;
      default:
        return;
    }
    setChanged(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.persist();
    if (values?.team.attributes.name !== e.target.value) setChanged(true);
    setName(e.target.value);
  };

  const handleDelete = () => {
    if (savingRef.current) return;
    setSaving(true);
    const team = { ...values?.team, attributes: { name } } as Organization;
    onDelete && onDelete(team);
    setSaving(false);
  };

  const handleProcess = (e: any) => {
    setProcess(e.target.value);
  };

  const nameInUse = (newName: string): boolean => {
    if (newName === values?.team.attributes.name) return false;
    const sameNameRec = organizations.filter(
      (o) => o?.attributes?.name === newName
    );
    return sameNameRec.length > 0;
  };
  const teamplan = useMemo(() => {
    var projs = projects
      .filter((p) => related(p, 'organization') === values?.team.id)
      .sort((i, j) =>
        i.attributes.dateCreated <= j.attributes.dateCreated ? -1 : 1
      );
    if (projs.length > 0) {
      var pplans = plans
        .filter((p) => related(p, 'project') === projs[0].id)
        .sort((i, j) =>
          i.attributes.dateCreated <= j.attributes.dateCreated ? -1 : 1
        );
      if (pplans.length > 0) return pplans[0].id;
    }
    return undefined;
  }, [plans, projects, values?.team.id]);

  useEffect(() => {
    if (isOpen) {
      if (!defaultParams) {
        setDefaultParams(values?.team.attributes?.defaultParams || '{}');
        if (values) {
          setName(values.team.attributes?.name || '');
          setIso(values.team.attributes?.iso || '');
          setBibleId(values.team.attributes?.bibleId || '');
          setBibleName(values.team.attributes?.bibleName || '');
          setIsoMediafile(related(values.team, 'isoMediafile') as string);
          setBibleMediafile(related(values.team, 'bibleMediafile') as string);
          setPublishingData(values.team.attributes?.publishingData || '{}');
        }
      }
    } else reset();

    if (isOpen && mode === DialogMode.add && processOptions.length === 0) {
      const opts = memory.cache.query((q: QueryBuilder) =>
        q.findRecords('workflowstep')
      ) as WorkflowStep[];
      const newProcess = opts.reduce((prev, cur) => {
        return prev.indexOf(cur.attributes.process) !== -1
          ? prev
          : prev.concat(cur.attributes.process);
      }, Array<string>());
      setProcessOptions(
        newProcess.map((p) => ({
          value: p,
          label: t.getString(p) || p,
        }))
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values, isOpen]);

  return (
    <div>
      <Dialog
        id="teamDialog"
        open={isOpen}
        onClose={handleClose}
        aria-labelledby="teamDlg"
        disableEnforceFocus
      >
        <DialogTitle id="teamDlg">
          {mode === DialogMode.add ? t.addTeam : t.teamSettings}
        </DialogTitle>
        <DialogContent>
          {saving && <LinearProgress id="busy" variant="indeterminate" />}
          <TextField
            autoFocus
            margin="dense"
            id="teamName"
            label={t.teamName}
            value={name}
            helperText={!saving && name && nameInUse(name) && t.nameInUse}
            onChange={handleChange}
            fullWidth
          />
          {mode !== DialogMode.add && (
            <PublishExpansion
              t={t}
              team={values?.team}
              teamplan={teamplan}
              onChanged={setChanged}
              setValue={setValue}
              organizations={organizations}
            />
          )}
          {mode === DialogMode.add && (
            <TextField
              id="process"
              select
              label={t.process}
              value={process || defaultWorkflow}
              onChange={handleProcess}
              sx={{ my: 2, width: '300px' }}
            >
              {processOptions
                .sort((i, j) => (i.label <= j.label ? -1 : 1))
                .map((o: OptionType, i) => (
                  <MenuItem key={i} value={o.value}>
                    {o.label}
                  </MenuItem>
                ))}
            </TextField>
          )}
          {mode === DialogMode.edit && (
            <div>
              <DeleteExpansion
                title={t.deleteTeam}
                explain={t.explainTeamDelete}
                handleDelete={handleDelete}
                inProgress={saving}
              />
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            id="teamCancel"
            onClick={handleClose}
            color="primary"
            disabled={saving}
          >
            {t.cancel}
          </Button>
          <Button
            id="teamCommit"
            onClick={handleCommit(process)}
            color="primary"
            disabled={saving || name === '' || nameInUse(name) || !changed}
          >
            {mode === DialogMode.add ? t.add : t.save}
          </Button>
        </DialogActions>
        {confirm && (
          <Confirm
            text={t.closeNoSave}
            no={t.cancel}
            noResponse={dontDoIt}
            yes={t.yes}
            yesResponse={reset}
          />
        )}
      </Dialog>
    </div>
  );
}

const mapRecordsToProps = {
  organizations: (q: QueryBuilder) => q.findRecords('organization'),
  projects: (q: QueryBuilder) => q.findRecords('project'),
  plans: (q: QueryBuilder) => q.findRecords('plan'),
};

export default withData(mapRecordsToProps)(TeamDialog) as any;
