import { useRef } from 'react';
import { useGetGlobal, useGlobal } from '../context/GlobalContext';
import { related } from '.';
import {
  IWorkflowStepsStrings,
  OrgWorkflowStep,
  OrgWorkflowStepD,
  WorkflowStepD,
} from '../model';
import { AddRecord, ReplaceRelatedRecord } from '../model/baseModel';
import {
  logError,
  Severity,
  toCamel,
  useWaitForRemoteQueue,
  waitForIt,
} from '../utils';
import JSONAPISource from '@orbit/jsonapi';
import { shallowEqual, useSelector } from 'react-redux';
import { workflowStepsSelector } from '../selector';
import {
  InitializedRecord,
  RecordOperation,
  RecordTransformBuilder,
} from '@orbit/records';
import { addPt } from '../utils/addPt';

export const defaultWorkflow = 'draft';

interface ISwitches {
  [key: string]: any;
}
export const useOrgWorkflowSteps = () => {
  const t: IWorkflowStepsStrings = useSelector(
    workflowStepsSelector,
    shallowEqual
  );

  const getGlobal = useGetGlobal();
  const [memory] = useGlobal('memory');
  const [coordinator] = useGlobal('coordinator');
  const remote = coordinator?.getSource('remote') as JSONAPISource;
  const [user] = useGlobal('user');
  const [errorReporter] = useGlobal('errorReporter');
  const [offline] = useGlobal('offline');
  const [offlineOnly] = useGlobal('offlineOnly');
  const waitForRemoteQueue = useWaitForRemoteQueue();
  const creatingRef = useRef(false);

  const localizedWorkStep = (val: string) => {
    return addPt((t as ISwitches)[toCamel(val)]) || val;
  };
  const localizedWorkStepFromId = (id: string) => {
    try {
      var step = memory.cache.query((q) =>
        q.findRecord({ type: 'orgworkflowstep', id: id })
      ) as OrgWorkflowStep;
      return localizedWorkStep(step.attributes.name);
    } catch {
      return '';
    }
  };

  const AddOrgWFToOps = async (
    tb: RecordTransformBuilder,
    wf: WorkflowStepD,
    org?: string
  ) => {
    let myOrgId = org ?? getGlobal('organization');
    // NB: The remoteId was not updated even though this always gets created online
    // let myOrgRemoteId = remoteId('organization', myOrgId, memory?.keyMap as RecordKeyMap);
    // if (!offline && !myOrgRemoteId) {
    //   console.error(`no org remoteId for ${myOrgId}`);
    //   return; // offline users won't have an org remoteId
    // }
    var ops: RecordOperation[] = [];
    const wfs = {
      type: 'orgworkflowstep',
      attributes: {
        ...wf.attributes,
      },
    } as OrgWorkflowStep;
    ops.push(...AddRecord(tb, wfs, user, memory));
    ops.push(
      ...ReplaceRelatedRecord(
        tb,
        wfs as InitializedRecord,
        'organization',
        'organization',
        myOrgId
      )
    );
    try {
      await memory.update(ops);
    } catch (ex) {
      logError(Severity.error, errorReporter, ex as Error);
    }
  };

  const QueryOrgWorkflowSteps = async (process: string, org: string) => {
    /* wait for new workflow steps remote id to fill in */
    await waitForRemoteQueue('waiting for workflow update');

    let orgworkflowsteps = memory.cache.query((q) =>
      q.findRecords('orgworkflowstep')
    ) as OrgWorkflowStepD[];
    if (orgworkflowsteps.length === 0 && remote) {
      //check remote
      orgworkflowsteps = (await remote.query((q) =>
        q.findRecords('orgworkflowstep')
      )) as OrgWorkflowStepD[];
    }
    return orgworkflowsteps
      .filter(
        (s) =>
          (process === 'ANY' || s.attributes.process === process) &&
          related(s, 'organization') === org &&
          Boolean(s.keys?.remoteId) !== offlineOnly
      )
      .sort((i, j) => i.attributes.sequencenum - j.attributes.sequencenum);
  };

  const CreateOrgWorkflowSteps = async (process: string, org: string) => {
    creatingRef.current = true;
    const workflowsteps = (
      (await memory.query((q) =>
        q
          .findRecords('workflowstep')
          .filter({ attribute: 'process', value: process })
      )) as WorkflowStepD[]
    )
      .filter((s) => Boolean(s?.keys?.remoteId) !== offlineOnly)
      .sort((a, b) => a.attributes.sequencenum - b.attributes.sequencenum);
    var tb = new RecordTransformBuilder();
    //originally had them all in one ops, but it was too fast
    //we have checks on the back end for duplicate entries (using just type, datecreated, dateupdated) because orbit sometimes sends twice
    for (var ix = 0; ix < workflowsteps.length; ix++)
      await AddOrgWFToOps(tb, workflowsteps[ix] as WorkflowStepD, org);
    creatingRef.current = false;
    return await QueryOrgWorkflowSteps(process, org);
  };

  interface IGetSteps {
    process: string;
    org: string;
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
    if (!org) {
      //hopefully we'll be back...
      return [];
    }
    //try to avoid creating orgworkflowsteps when we're switching modes
    var retry = 0;
    do {
      if (retry > 0) await new Promise((resolve) => setTimeout(resolve, 1000));
      var orgsteps = await QueryOrgWorkflowSteps(process, org);
      retry++;
    } while (orgsteps.length === 0 && retry < 3);

    // if (orgsteps.length === 0) {
    //   orgsteps = await CreateOrgWorkflowSteps(
    //     process === 'ANY' ? defaultWorkflow : process,
    //     org
    //   );
    // }
    return orgsteps.filter((s) => showAll || s.attributes.sequencenum >= 0);
  };

  return {
    GetOrgWorkflowSteps,
    CreateOrgWorkflowSteps,
    localizedWorkStepFromId,
    localizedWorkStep,
  };
};
