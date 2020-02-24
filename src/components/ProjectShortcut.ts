import { PlanType } from '../model';
import { Schema, KeyMap } from '@orbit/data';
import Memory from '@orbit/memory';
import { remoteId, waitForRemoteId } from '../utils';
import { saveNewPlan, saveNewSection, saveNewPassage } from '../crud';

interface IProps {
  organization: string;
  project: string;
  planName: string;
  planType: string;
  planTypes: PlanType[];
  sectionName: string;
  reference: string;
  schema: Schema;
  memory: Memory;
  keyMap: KeyMap;
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
    schema,
    memory,
    keyMap,
    user,
  } = props;

  const plan = await saveNewPlan({
    project,
    name: planName,
    planType,
    schema,
    memory,
  });
  const section = await saveNewSection({
    sequencenum: 1,
    name: sectionName,
    plan,
    schema,
    memory,
  });
  await saveNewPassage({
    sequencenum: 1,
    reference,
    section,
    schema,
    memory,
    user,
  });
  const planId = await waitForRemoteId(plan, keyMap);
  const projId = await waitForRemoteId(
    { type: 'project', id: project },
    keyMap
  );
  const rec = planTypes.filter(pt => pt.id === planType);
  const typeName = rec.length > 0 ? rec[0].attributes.name : 'other';
  return {
    url: '/main/{0}/{1}-plan/{2}/{3}/1/'
      .replace('{0}', remoteId('organization', organization, keyMap))
      .replace('{1}', typeName.toLowerCase())
      .replace('{2}', projId)
      .replace('{3}', planId),
    planId: plan.id,
  };
};
