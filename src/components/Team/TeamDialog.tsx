import React, { useContext, useEffect, useRef, useState } from 'react';
import { useGlobal } from 'reactn';
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
  OrganizationD,
  IDialog,
  DialogMode,
  OptionType,
  WorkflowStep,
  BibleD,
} from '../../model';
import DeleteExpansion from '../DeleteExpansion';
import { TeamContext } from '../../context/TeamContext';
import { defaultWorkflow, related, useBible } from '../../crud';
import PublishExpansion from '../PublishExpansion';
import { UnsavedContext } from '../../context/UnsavedContext';
import { useCanPublish, waitForIt } from '../../utils';
import { useOrbitData } from '../../hoc/useOrbitData';
import { RecordIdentity } from '@orbit/records';

export interface ITeamDialog {
  team: OrganizationD;
  bible?: BibleD;
  process?: string;
  bibleMediafile: string;
  isoMediafile: string;
}
interface IProps extends IDialog<ITeamDialog> {
  onDelete?: (team: RecordIdentity) => void;
  disabled?: boolean;
}
export function TeamDialog(props: IProps) {
  const { mode, values, isOpen, disabled, onOpen, onCommit, onDelete } = props;
  const bibles = useOrbitData<BibleD[]>('bible');
  const organizations = useOrbitData<OrganizationD[]>('organization');
  const [name, setName] = React.useState('');
  const [iso, setIso] = React.useState('');
  const [bible, setBible] = React.useState<BibleD | undefined>(values?.bible);
  const [bibleId, setBibleId] = React.useState('');
  const [readonly, setReadonly] = useState(false);
  const [owner, setOwner] = useState('');
  const [bibleIdError, setBibleIdError] = useState('');
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
  const recordingRef = useRef(false);
  const [recording, setRecordingx] = useState(false);
  const [confirm, setConfirm] = React.useState(false);
  const { anySaving, toolsChanged, startSave, clearRequested } =
    useContext(UnsavedContext).state;
  const { getBible, getBibleOwner, getOrgBible } = useBible();
  const { canPublish } = useCanPublish();

  const reset = () => {
    setName('');
    setDefaultParams('');
    setChanged(false);
    setProcess(undefined);
    setSaving(false);
    setConfirm(false);
    setBibleId('');
    setBibleIdError('');
    setBible(undefined);
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
  const setRecording = (recording: boolean) => {
    setRecordingx(recording);
    recordingRef.current = recording;
  };
  const setBibleMediafile = (value: string) => {
    bibleMediafileRef.current = value;
  };
  const setIsoMediafile = (value: string) => {
    isoMediafileRef.current = value;
  };
  const handleCommit = (process: string | undefined) => () => {
    if (savingRef.current) return;
    setSaving(true);
    startSave();
    //wait a beat for the save to register
    setTimeout(() => {
      waitForIt(
        'anySaving',
        () => !anySaving(),
        () => false,
        10000
      ).finally(() => {
        const current =
          mode === DialogMode.edit && values
            ? values.team
            : ({ attributes: {} } as OrganizationD);

        const team = {
          ...current,
          attributes: {
            ...current.attributes,
            name,
            defaultParams,
          },
        } as OrganizationD;
        let newbible: BibleD | undefined = undefined;
        if (bibleId.length > 0 && bibleIdError === '') {
          newbible =
            getOrgBible(team.id) ?? ({ ...bible, type: 'bible' } as BibleD);
          if (bibleId)
            newbible = {
              ...newbible,
              attributes: {
                ...newbible?.attributes,
                bibleId,
                bibleName,
                iso,
                publishingData,
              },
            } as BibleD;
        }
        onCommit(
          {
            team,
            bible: newbible,
            bibleMediafile: bibleMediafileRef.current,
            isoMediafile: isoMediafileRef.current,
            process: process || defaultWorkflow,
          },
          async (id: string) => {
            reset();
          }
        );
      });
    }, 100);
  };
  const setValue = (what: string, value: string) => {
    switch (what) {
      case 'iso':
        setIso(value);
        break;
      case 'bibleId':
        setBibleId(value);
        break;
      case 'bibleIdError':
        setBibleIdError(value);
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
    const team = { ...values?.team } as RecordIdentity;
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

  useEffect(() => {
    if (isOpen) {
      if (!defaultParams) {
        setDefaultParams(values?.team.attributes?.defaultParams || '{}');
        if (values) {
          setName(values.team.attributes?.name || '');
          setBible(getOrgBible(values.team.id));
        }
      }
    } else reset();

    if (isOpen && mode === DialogMode.add && processOptions.length === 0) {
      const opts = memory.cache.query((q) =>
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

  useEffect(() => {
    if (isOpen)
      if (bibleId && bibleId.length > 5) {
        let newbible = getBible(bibleId);
        if (bible !== newbible) setBible(newbible);
      } else {
        setBible(undefined);
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bibleId]);

  useEffect(() => {
    setReadonly((owner && owner !== values?.team.id) || bibleId.length === 0);
  }, [owner, bibleIdError, bibleId, values]);

  useEffect(() => {
    if (bible) {
      setBibleId(bible.attributes?.bibleId || '');
      setIso(bible?.attributes?.iso || '');
      setBibleName(bible?.attributes?.bibleName || '');
      setIsoMediafile(related(bible, 'isoMediafile') as string);
      setBibleMediafile(related(bible, 'bibleMediafile') as string);
      setPublishingData(bible?.attributes?.publishingData || '{}');
      setOwner(getBibleOwner(bible.id));
    } else setOwner('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bible]);

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
            required
            onChange={handleChange}
            fullWidth
          />
          {mode !== DialogMode.add && canPublish && (
            <PublishExpansion
              t={t}
              team={values?.team}
              bible={bible}
              onChanged={setChanged}
              onRecording={setRecording}
              setValue={setValue}
              bibles={bibles}
              readonly={readonly}
            />
          )}
          {mode === DialogMode.add && (
            <TextField
              id="process"
              select
              label={t.process}
              value={
                processOptions
                  .map((o) => o.value)
                  .includes(process || defaultWorkflow)
                  ? process || defaultWorkflow
                  : ''
              }
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
            disabled={
              disabled ||
              recording ||
              saving ||
              name === '' ||
              nameInUse(name) ||
              !changed ||
              bibleIdError !== ''
            }
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

export default TeamDialog;
