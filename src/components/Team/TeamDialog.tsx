import React, { useEffect, useRef, useState } from 'react';
import { useGlobal } from 'reactn';
import { withData } from 'react-orbitjs';
import { QueryBuilder } from '@orbit/data';
import {
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  LinearProgress,
  SxProps,
} from '@mui/material';
import {
  Organization,
  IDialog,
  DialogMode,
  OptionType,
  WorkflowStep,
  Project,
} from '../../model';
import DeleteExpansion from '../DeleteExpansion';
import { TeamContext } from '../../context/TeamContext';
import { defaultWorkflow, related } from '../../crud';

interface IRecordProps {
  organizations: Array<Organization>;
  projects: Array<Project>;
}
interface ITeamDialog {
  team: Organization;
  process?: string;
}
interface IProps extends IRecordProps, IDialog<ITeamDialog> {
  onDelete?: (team: Organization) => void;
}
const formText = { fontSize: 'small' } as SxProps;
const menuProps = { width: '300px' } as SxProps;
const textFieldProps = { mx: 1, width: '300px' } as SxProps;

export function TeamDialog(props: IProps) {
  const {
    mode,
    values,
    isOpen,
    organizations,
    projects,
    onOpen,
    onCommit,
    onDelete,
  } = props;
  const [name, setName] = React.useState('');
  const [changed, setChanged] = React.useState(false);
  const ctx = React.useContext(TeamContext);
  const { cardStrings } = ctx.state;
  const t = cardStrings;
  const [memory] = useGlobal('memory');
  const [isDeveloper] = useGlobal('developer');
  const [process, setProcess] = useState<string>();
  const [processOptions, setProcessOptions] = useState<OptionType[]>([]);
  const savingRef = useRef(false);
  const [saving, setSavingx] = useState(false);
  //NR? const [noteProjId, setNoteProjId] = useState('');
  const [myProjects, setMyProjects] = useState<Project[]>([]);

  const reset = () => {
    setName('');
    setChanged(false);
  };
  const handleClose = () => {
    reset();
    setProcess(undefined);
    onOpen && onOpen(false);
  };

  const setSaving = (saving: boolean) => {
    setSavingx(saving);
    savingRef.current = saving;
  };

  const handleCommit = (process: string | undefined) => async () => {
    if (savingRef.current) return;
    setSaving(true);
    const current =
      mode === DialogMode.edit && values
        ? values.team
        : ({ attributes: {} } as Organization);
    //NR? if (current.hasOwnProperty('relationships')) delete current?.relationships;
    const team = {
      ...current,
      attributes: { ...current.attributes, name },
      //NR?
      /* relationships: {
        noteProject: {
          data: noteProjId ? { type: 'project', id: noteProjId } : null,
        },
      }, */
    } as Organization;
    onCommit(
      { team, process: process || defaultWorkflow },
      async (id: string) => {
        setProcess(undefined);
        setSaving(false);
      }
    );
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

  useEffect(() => {
    if (isOpen && values && projects) {
      setMyProjects(
        projects.filter((p) => related(p, 'organization') === values.team.id)
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values, projects, isOpen]);

  useEffect(() => {
    if (isOpen && !name) {
      setName(values?.team.attributes?.name || '');
      //NR?setNoteProjId(values ? related(values, 'noteProject') : '');
    } else if (!isOpen) {
      reset();
    }
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

  const handleNoteProjectChange = (e: any) => {
    //NR?  setNoteProjId(e.target.value);
    setChanged(true);
  };

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
              {isDeveloper && (
                <TextField
                  id="select-note-project"
                  select
                  label={t.notesProject}
                  helperText={t.notesHelper}
                  value={''} //NR?noteProjId ?? ''}
                  onChange={handleNoteProjectChange}
                  SelectProps={{
                    MenuProps: {
                      sx: menuProps,
                    },
                  }}
                  sx={textFieldProps}
                  InputProps={{ sx: formText }}
                  InputLabelProps={{ sx: formText }}
                  margin="normal"
                  variant="filled"
                  required={true}
                >
                  {myProjects
                    .sort((i, j) =>
                      i.attributes.name <= j.attributes.name ? -1 : 1
                    )
                    .map((option: Project) => (
                      <MenuItem key={option.id} value={option.id}>
                        {option.attributes.name}
                      </MenuItem>
                    ))}
                </TextField>
              )}
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
      </Dialog>
    </div>
  );
}

const mapRecordsToProps = {
  organizations: (q: QueryBuilder) => q.findRecords('organization'),
  projects: (q: QueryBuilder) => q.findRecords('project'),
};

export default withData(mapRecordsToProps)(TeamDialog) as any;
