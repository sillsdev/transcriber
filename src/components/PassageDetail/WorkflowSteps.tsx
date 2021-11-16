import React, { useState, useMemo, useEffect } from 'react';
import { createStyles, makeStyles, Theme } from '@material-ui/core';
import { connect } from 'react-redux';
import {
  IWorkflowStepsStrings,
  ISharedStrings,
  IState,
  OrgWorkflowStep,
  WorkflowStep,
} from '../../model';
import localStrings from '../../selector/localize';
import { toCamel } from '../../utils';
import { Stage } from '../../control/Stage';
import { withData } from '../../mods/react-orbitjs';
import { QueryBuilder } from '@orbit/data';
import { related } from '../../crud';
import usePassageDetailContext from '../../context/usePassageDetailContext';
import { useOrgWorkflowSteps } from '../../crud/useOrgWorkflowSteps';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      display: 'flex',
      margin: theme.spacing(1),
    },
  })
);

interface IStateProps {
  t: IWorkflowStepsStrings;
  ts: ISharedStrings;
}
interface IRecordProps {
  workflowsteps: WorkflowStep[];
  orgworkflowsteps: OrgWorkflowStep[];
}
interface IProps extends IStateProps, IRecordProps {}

interface simpleWF {
  id: string;
  label: string;
}

export function WorkflowSteps(props: IProps) {
  const { t, workflowsteps, orgworkflowsteps } = props;
  const { passage, currentstep, setCurrentStep, setOrgWorkflowSteps } =
    usePassageDetailContext();
  const classes = useStyles();
  const [workflow, setWorkflow] = useState<simpleWF[]>([]);
  const [indexPassageCurrent, setIndexPassageCurrent] = useState(0);
  const { GetOrgWorkflowSteps } = useOrgWorkflowSteps();
  useEffect(() => {
    var wf: simpleWF[] = [];
    GetOrgWorkflowSteps('OBT').then((orgsteps: any[]) => {
      setOrgWorkflowSteps(orgsteps);
      wf = orgsteps.map((s) => {
        return {
          id: s.id,
          label: t.getString(toCamel(s.attributes.name)) || s.attributes.name,
        };
      });
      setWorkflow(wf);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workflowsteps, orgworkflowsteps]);

  useEffect(() => {
    var passagewf = related(passage, 'orgWorkflowStep');
    var psgIndex = workflow.findIndex((wf) => wf.id === passagewf);
    setIndexPassageCurrent(psgIndex); //-1 ok
    if (currentstep === '' && workflow.length > 0) {
      setCurrentStep(workflow[psgIndex + 1].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workflow, passage, currentstep]);

  const index = useMemo(
    () => (workflow ? workflow.findIndex((wf) => wf.id === currentstep) : 0),
    [currentstep, workflow]
  );

  const curColor = (i: number) => {
    return i === index
      ? 'lightblue'
      : i <= indexPassageCurrent
      ? 'lightgreen'
      : undefined;
  };

  const handleSelect = (item: string) => {
    if (item === currentstep) {
      //do nothing;
    } else {
      setCurrentStep(item);
    }
  };

  return (
    <div className={classes.root}>
      {workflow.map((w, i) => {
        return (
          <Stage
            id={w.id}
            label={w.label}
            color={curColor(i)}
            done={i <= indexPassageCurrent}
            select={handleSelect}
          />
        );
      })}
    </div>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'workflowSteps' }),
  ts: localStrings(state, { layout: 'shared' }),
});
const mapRecordsToProps = {
  workflowsteps: (q: QueryBuilder) => q.findRecords('workflowstep'),
  orgworkflowsteps: (q: QueryBuilder) => q.findRecords('orgworkflowstep'),
};

export default withData(mapRecordsToProps)(
  connect(mapStateToProps)(WorkflowSteps) as any
) as any;
