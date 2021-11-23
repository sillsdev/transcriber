import { Operation, QueryBuilder, TransformBuilder } from '@orbit/data';
import { useGlobal, useRef } from 'reactn';
import { related } from '.';
import { OrgWorkflowStep, WorkflowStep } from '../model';
import { AddRecord } from '../model/baseModel';
import { logError, Severity, waitForIt } from '../utils';

export const useOrgWorkflowSteps = () => {
  const [organization] = useGlobal('organization');
  const [memory] = useGlobal('memory');
  const [user] = useGlobal('user');
  const [errorReporter] = useGlobal('errorReporter');
  const [offline] = useGlobal('offline');
  const [offlineOnly] = useGlobal('offlineOnly');
  const creatingRef = useRef(false);

  const AddOrgWFToOps = async (t: TransformBuilder, wf: WorkflowStep) => {
    var ops: Operation[] = [];
    const wfs = {
      type: 'orgworkflowstep',
      attributes: {
        ...wf.attributes,
      },
    } as OrgWorkflowStep;
    ops.push(...AddRecord(t, wfs, user, memory));
    const orgRecId = { type: 'organization', id: organization };
    ops.push(t.replaceRelatedRecord(wfs, 'organization', orgRecId));
    console.log(wfs.attributes.name, wfs.attributes.dateCreated);
    try {
      await memory.update(ops);
    } catch (ex) {
      logError(Severity.error, errorReporter, ex as Error);
    }
  };

  const QueryOrgWorkflowSteps = (process: string) => {
    const orgworkflowsteps = memory.cache.query((q: QueryBuilder) =>
      q
        .findRecords('orgworkflowstep')
        .filter({ attribute: 'process', value: process })
    ) as OrgWorkflowStep[];

    return orgworkflowsteps
      .filter((s) => related(s, 'organization') === organization)
      .sort((i, j) => i.attributes.sequencenum - j.attributes.sequencenum);
  };

  const CreateOrgWorkflowSteps = async (process: string) => {
    creatingRef.current = true;
    const workflowsteps = memory.cache.query((q: QueryBuilder) =>
      q
        .findRecords('workflowstep')
        .filter({ attribute: 'process', value: process })
    ) as WorkflowStep[];
    var tb = new TransformBuilder();
    //originally had them all in one ops, but it was too fast
    //we have checks on the back end for duplicate entries (using just type, datecreated, dateupdated) because orbit sometimes sends twice
    for (var ix = 0; ix < workflowsteps.length; ix++)
      await AddOrgWFToOps(tb, workflowsteps[ix]);
    creatingRef.current = false;
    return QueryOrgWorkflowSteps(process);
  };

  const GetOrgWorkflowSteps = async (process: string) => {
    if (creatingRef.current && (!offline || offlineOnly))
      await waitForIt(
        'creating org workflow',
        () => !creatingRef.current,
        () => false,
        100
      );
    var orgsteps = QueryOrgWorkflowSteps(process);
    if (orgsteps.length === 0) {
      orgsteps = await CreateOrgWorkflowSteps(process);
    }
    return orgsteps;
  };

  return { GetOrgWorkflowSteps };
};
