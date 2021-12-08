import React, { useEffect, useState } from 'react';
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
import { BigDialog } from '../../hoc/BigDialog';
import { StepEditor } from '../StepEditor';
import { waitForIt } from '../../utils';
import { useOrgWorkflowSteps } from '../../crud/useOrgWorkflowSteps';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    process: {
      width: '200px',
      marginRight: theme.spacing(2),
    },
    button: {
      alignSelf: 'center',
    },
    row: {
      display: 'flex',
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
  const { cardStrings, sharedStrings } = ctx.state;
  const t = cardStrings;
  const ts = sharedStrings;
  const teamApiPull = useTeamApiPull();
  const { GetOrgWorkflowSteps } = useOrgWorkflowSteps();
  const [global] = useGlobal();
  const [memory] = useGlobal('memory');
  const [offlineOnly] = useGlobal('offlineOnly');
  const [showWorkflow, setShowWorkflow] = useState(false);
  const [process, setProcess] = useState<string>();
  const [processOptions, setProcessOptions] = useState<OptionType[]>([]);

  const handleClose = () => {
    onOpen && onOpen(false);
  };

  const countTeams = (name: string) => {
    const recs = memory.cache.query((q: QueryBuilder) =>
      q.findRecords('organization')
    ) as Organization[];
    return recs.filter(
      (r) =>
        r.attributes.name === name && Boolean(r.keys?.remoteId) === !offlineOnly
    ).length;
  };

  const handleCommit = async () => {
    const current =
      mode === DialogMode.edit && values
        ? values
        : ({ attributes: {} } as Organization);
    if (current.hasOwnProperty('relationships')) delete current?.relationships;
    const team = {
      ...current,
      attributes: { ...current.attributes, name },
    } as Organization;
    const curCount = countTeams(name);
    onCommit(team);
    if (mode === DialogMode.add) {
      waitForIt(
        'team created',
        () => countTeams(name) === curCount + 1 && global.organization !== '',
        () => false,
        200
      ).then(() => {
        console.log(`org=${global.organization}`);
        GetOrgWorkflowSteps(process || 'OBT');
      });
    }
    onOpen && onOpen(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.persist();
    setName(e.target.value);
  };

  const handleDelete = () => {
    const team = { ...values, attributes: { name } } as Organization;
    onDelete && onDelete(team);
  };

  const handleWorkflow = (isOpen: boolean) => {
    setShowWorkflow(isOpen);
  };

  const handleEditWorkflow = () => {
    setShowWorkflow(true);
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
          <TextField
            autoFocus
            margin="dense"
            id="teamName"
            label={t.teamName}
            value={name}
            helperText={name && nameInUse(name) && t.nameInUse}
            onChange={handleChange}
            fullWidth
          />
          <div className={classes.row}>
            {mode === DialogMode.add ? (
              <TextField
                id="process"
                select
                label={t.process}
                value={process}
                onChange={handleProcess}
                className={classes.process}
              >
                {processOptions.map((o: OptionType, i) => (
                  <MenuItem key={i} value={o.value}>
                    {o.label}
                  </MenuItem>
                ))}
              </TextField>
            ) : (
              <Button
                onClick={handleEditWorkflow}
                variant="contained"
                className={classes.button}
              >
                {t.editWorkflow}
              </Button>
            )}
          </div>
          {mode === DialogMode.edit && (
            <DeleteExpansion
              title={t.deleteTeam}
              explain={t.explainTeamDelete}
              handleDelete={handleDelete}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button id="teamCancel" onClick={handleClose} color="primary">
            {t.cancel}
          </Button>
          <Button
            id="teamCommit"
            onClick={handleCommit}
            color="primary"
            disabled={name === '' || nameInUse(name)}
          >
            {mode === DialogMode.add ? t.add : t.save}
          </Button>
        </DialogActions>
      </Dialog>
      <BigDialog
        title={t.editWorkflow}
        isOpen={showWorkflow}
        onOpen={handleWorkflow}
        ts={ts}
      >
        <StepEditor process={process} org={values?.id} />
      </BigDialog>
    </div>
  );
}

const mapRecordsToProps = {
  organizations: (q: QueryBuilder) => q.findRecords('organization'),
};

export default withData(mapRecordsToProps)(TeamDialog) as any;
