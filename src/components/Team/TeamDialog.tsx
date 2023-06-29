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
import { useOrgWorkflowSteps } from '../../crud/useOrgWorkflowSteps';

interface IRecordProps {
  organizations: Array<Organization>;
  projects: Array<Project>;
}

interface IProps extends IRecordProps, IDialog<Organization> {
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
  const { CreateOrgWorkflowSteps } = useOrgWorkflowSteps();
  const [memory] = useGlobal('memory');
  const [process, setProcess] = useState<string>();
  const [processOptions, setProcessOptions] = useState<OptionType[]>([]);
  const savingRef = useRef(false);
  const [glossaryProjId, setGlossaryProjId] = useState('');
  const [sidebarProjId, setSidebarProjId] = useState('');
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

  const handleCommit = async () => {
    savingRef.current = true;
    const current =
      mode === DialogMode.edit && values
        ? values
        : ({ attributes: {} } as Organization);
    if (current.hasOwnProperty('relationships')) delete current?.relationships;
    const team = {
      ...current,
      attributes: { ...current.attributes, name },
      relationships: {
        glossaryProject: {
          data: glossaryProjId ? { type: 'project', id: glossaryProjId } : null,
        },
        sidebarProject: {
          data: sidebarProjId ? { type: 'project', id: sidebarProjId } : null,
        },
      },
    } as Organization;
    onCommit(team, async (id: string) => {
      if (mode === DialogMode.add) {
        CreateOrgWorkflowSteps(process || defaultWorkflow, id).finally(() => {
          setProcess(undefined);
          savingRef.current = false;
        });
      } else {
        savingRef.current = false;
      }
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.persist();
    if (values?.attributes.name !== e.target.value) setChanged(true);
    setName(e.target.value);
  };

  const handleDelete = () => {
    savingRef.current = true;
    const team = { ...values, attributes: { name } } as Organization;
    onDelete && onDelete(team);
    savingRef.current = false;
  };

  const handleProcess = (e: any) => {
    setProcess(e.target.value);
  };

  const nameInUse = (newName: string): boolean => {
    if (newName === values?.attributes.name) return false;
    const sameNameRec = organizations.filter(
      (o) => o?.attributes?.name === newName
    );
    return sameNameRec.length > 0;
  };

  useEffect(() => {
    if (isOpen && values && projects) {
      setMyProjects(
        projects.filter((p) => related(p, 'organization') === values.id)
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values, projects, isOpen]);

  useEffect(() => {
    if (isOpen && !name) {
      setName(values?.attributes?.name || '');
      setGlossaryProjId(values ? related(values, 'glossaryProject') : '');
      setSidebarProjId(values ? related(values, 'sidebarProject') : '');
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

  const handleGlossaryProjectChange = (e: any) => {
    setGlossaryProjId(e.target.value);
    setChanged(true);
  };
  const handleSidebarProjectChange = (e: any) => {
    setSidebarProjId(e.target.value);
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
          {savingRef.current && (
            <LinearProgress id="busy" variant="indeterminate" />
          )}
          <TextField
            autoFocus
            margin="dense"
            id="teamName"
            label={t.teamName}
            value={name}
            helperText={
              !savingRef.current && name && nameInUse(name) && t.nameInUse
            }
            onChange={handleChange}
            fullWidth
          />
          {mode === DialogMode.add && (
            <TextField
              id="process"
              select
              label={t.process}
              value={process || ''}
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
              <TextField
                id="select-glossary-project"
                select
                label={t.shortNotesProject}
                helperText={t.shortNotes}
                value={glossaryProjId}
                onChange={handleGlossaryProjectChange}
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
              <TextField
                id="select-sidebar-project"
                select
                label={t.longNotesProject}
                helperText={t.longNotes}
                value={sidebarProjId}
                onChange={handleSidebarProjectChange}
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
              <DeleteExpansion
                title={t.deleteTeam}
                explain={t.explainTeamDelete}
                handleDelete={handleDelete}
                inProgress={savingRef.current}
              />
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            id="teamCancel"
            onClick={handleClose}
            color="primary"
            disabled={savingRef.current}
          >
            {t.cancel}
          </Button>
          <Button
            id="teamCommit"
            onClick={handleCommit}
            color="primary"
            disabled={
              savingRef.current || name === '' || nameInUse(name) || !changed
            }
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
