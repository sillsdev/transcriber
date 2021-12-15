import { Operation, QueryBuilder, TransformBuilder } from '@orbit/data';
import { useGlobal, useRef } from 'reactn';
import { related } from '.';
import { OrgWorkflowStep, WorkflowStep } from '../model';
import { AddRecord } from '../model/baseModel';
import { logError, Severity, waitForIt } from '../utils';
import JSONAPISource from '@orbit/jsonapi';

export const useOrgWorkflowSteps = () => {
  const [global] = useGlobal();
  const [memory] = useGlobal('memory');
  const [coordinator] = useGlobal('coordinator');
  const remote = coordinator.getSource('remote') as JSONAPISource;
  const [user] = useGlobal('user');
  const [errorReporter] = useGlobal('errorReporter');
  const [offline] = useGlobal('offline');
  const [offlineOnly] = useGlobal('offlineOnly');
  const creatingRef = useRef(false);

  const AddOrgWFToOps = async (
    t: TransformBuilder,
    wf: WorkflowStep,
    org?: string
  ) => {
    var ops: Operation[] = [];
    const wfs = {
      type: 'orgworkflowstep',
      attributes: {
        ...wf.attributes,
      },
    } as OrgWorkflowStep;
    ops.push(...AddRecord(t, wfs, user, memory));
    const orgRecId = { type: 'organization', id: org || global.organization };
    ops.push(t.replaceRelatedRecord(wfs, 'organization', orgRecId));
    try {
      await memory.update(ops);
    } catch (ex) {
      logError(Severity.error, errorReporter, ex as Error);
    }
  };

  const QueryOrgWorkflowSteps = async (process: string, org?: string) => {
    /* wait for new workflow steps remote id to fill in */
    await waitForIt(
      'waiting for workflow update',
      () => !remote || remote.requestQueue.length === 0,
      () => offline && !offlineOnly,
      200
    );

    const orgworkflowsteps = memory.cache.query((q: QueryBuilder) =>
      q.findRecords('orgworkflowstep')
    ) as OrgWorkflowStep[];

    return orgworkflowsteps
      .filter(
        (s) =>
          (process === 'ANY' || s.attributes.process === process) &&
          related(s, 'organization') === (org || global.organization) &&
          Boolean(s.keys?.remoteId) !== offlineOnly
      )
      .sort((i, j) => i.attributes.sequencenum - j.attributes.sequencenum);
  };

  const CreateOrgWorkflowSteps = async (process: string, org?: string) => {
    creatingRef.current = true;
    const workflowsteps = (
      memory.cache.query((q: QueryBuilder) =>
        q
          .findRecords('workflowstep')
          .filter({ attribute: 'process', value: process })
      ) as WorkflowStep[]
    ).filter((s) => Boolean(s.keys?.remoteId) !== offlineOnly);
    var tb = new TransformBuilder();
    //originally had them all in one ops, but it was too fast
    //we have checks on the back end for duplicate entries (using just type, datecreated, dateupdated) because orbit sometimes sends twice
    for (var ix = 0; ix < workflowsteps.length; ix++)
      await AddOrgWFToOps(tb, workflowsteps[ix], org);
    creatingRef.current = false;
    return await QueryOrgWorkflowSteps(process, org);
  };

  interface IGetSteps {
    process: string;
    org?: string;
    showAll?: boolean;
  }

  const GetOrgWorkflowSteps = async ({ process, org, showAll }: IGetSteps) => {
    if (creatingRef.current && (!offline || offlineOnly))
      await waitForIt(
        'creating org workflow',
        () => !creatingRef.current,
        () => false,
        100
      );
    var orgsteps = await QueryOrgWorkflowSteps(process, org);
    if (orgsteps.length === 0) {
      orgsteps = await CreateOrgWorkflowSteps(process, org);
    }
    return orgsteps.filter((s) => showAll || s.attributes.sequencenum >= 0);
  };

  return { GetOrgWorkflowSteps };
};
