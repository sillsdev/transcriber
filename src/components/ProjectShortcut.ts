import { PlanType } from '../model';
import Memory from '@orbit/memory';
import { remoteId, waitForRemoteId, remoteIdNum } from '../utils';
import { saveNewPlan, saveNewSection, saveNewPassage } from '../crud';

interface IProps {
  organization: string;
  project: string;
  planName: string;
  planType: string;
  planTypes: PlanType[];
  sectionName: string;
  reference: string;
  memory: Memory;
  user: string;
}

export const projectShortcut = async (props: IProps) => {
  const {
    organization,
    project,
    planName,
    planType,
    planTypes,
    sectionName,
    reference,
    memory,
    user,
  } = props;

  const plan = await saveNewPlan({
    project,
    name: planName,
    planType,
    memory,
  });
  const userId = remoteIdNum('user', user, memory.keyMap);
  const section = await saveNewSection({
    sequencenum: 1,
    name: sectionName,
    plan,
    memory,
    userId,
  });
  await saveNewPassage({
    sequencenum: 1,
    reference,
    section,
    memory,
    userId,
  });
  const planId = await waitForRemoteId(plan, memory.keyMap);
  const projId = await waitForRemoteId(
    { type: 'project', id: project },
    memory.keyMap
  );
  const rec = planTypes.filter((pt) => pt.id === planType);
  const typeName = rec.length > 0 ? rec[0].attributes.name : 'other';
  return {
    url: '/main/{0}/{1}-plan/{2}/{3}/1/'
      .replace('{0}', remoteId('organization', organization, memory.keyMap))
      .replace('{1}', typeName.toLowerCase())
      .replace('{2}', projId)
      .replace('{3}', planId),
    planId: plan.id,
  };
};
