import React, { useEffect, useRef, useState } from 'react';
import { useGlobal } from 'reactn';
import { withData } from '../../mods/react-orbitjs';
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
} from '@material-ui/core';
import { makeStyles, createStyles, Theme } from '@material-ui/core';
import {
  Organization,
  IDialog,
  DialogMode,
  OptionType,
  WorkflowStep,
} from '../../model';
import DeleteExpansion from '../DeleteExpansion';
import { TeamContext } from '../../context/TeamContext';
import { useTeamApiPull } from '../../crud';
import { useOrgWorkflowSteps } from '../../crud/useOrgWorkflowSteps';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    process: {
      width: '200px',
      marginTop: theme.spacing(2),
      marginBottom: theme.spacing(2),
    },
  })
);
interface IRecordProps {
  organizations: Array<Organization>;
}

interface IProps extends IRecordProps, IDialog<Organization> {
  onDelete?: (team: Organization) => void;
}

export function TeamDialog(props: IProps) {
  const { mode, values, isOpen, organizations, onOpen, onCommit, onDelete } =
    props;
  const classes = useStyles();
  const [name, setName] = React.useState('');
  const ctx = React.useContext(TeamContext);
  const { cardStrings } = ctx.state;
  const t = cardStrings;
  const teamApiPull = useTeamApiPull();
  const { GetOrgWorkflowSteps } = useOrgWorkflowSteps();
  const [memory] = useGlobal('memory');
  const [offlineOnly] = useGlobal('offlineOnly');
  const [process, setProcess] = useState<string>();
  const [processOptions, setProcessOptions] = useState<OptionType[]>([]);
  const savingRef = useRef(false);

  const handleClose = () => {
    setName('');
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
    } as Organization;
    onCommit(team, async () => {
      if (mode === DialogMode.add) {
        await GetOrgWorkflowSteps({ process: process || 'OBT' });
      }
      setProcess(undefined);
      savingRef.current = false;
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.persist();
    setName(e.target.value);
  };

  const handleDelete = () => {
    const team = { ...values, attributes: { name } } as Organization;
    onDelete && onDelete(team);
  };

  const handleProcess = (e: any) => {
    setProcess(e.target.value);
  };

  const nameInUse = (newName: string): boolean => {
    const sameNameRec = organizations.filter(
      (o) => o?.attributes?.name === newName
    );
    return sameNameRec.length > 0;
  };

  useEffect(() => {
    if (isOpen && !name) {
      setName(values?.attributes?.name || '');
      if (!offlineOnly && values) teamApiPull(values.id);
    } else if (!isOpen) {
      setName('');
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

  return (
    <div>
      <Dialog
        id="teamDialog"
        open={isOpen}
        onClose={handleClose}
        aria-labelledby="teamDlg"
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
              className={classes.process}
            >
              {processOptions
                .sort((i, j) => (i.label < j.label ? -1 : 1))
                .map((o: OptionType, i) => (
                  <MenuItem key={i} value={o.value}>
                    {o.label}
                  </MenuItem>
                ))}
            </TextField>
          )}
          {mode === DialogMode.edit && (
            <DeleteExpansion
              title={t.deleteTeam}
              explain={t.explainTeamDelete}
              handleDelete={handleDelete}
            />
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
            disabled={savingRef.current || name === '' || nameInUse(name)}
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
};

export default withData(mapRecordsToProps)(TeamDialog) as any;
