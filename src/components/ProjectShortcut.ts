import { PlanType } from '../model';
import { Schema, KeyMap } from '@orbit/data';
import Memory from '@orbit/memory';
import { remoteId } from '../utils';
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
  });
  const checkPlan = () => {
    const val = remoteId('plan', plan.id, keyMap);
    if (typeof val === 'undefined') {
      setTimeout(checkPlan, 100);
    }
  };
  checkPlan();
  const rec = planTypes.filter(pt => pt.id === planType);
  const typeName = rec.length > 0 ? rec[0].attributes.name : 'other';
  return {
    url: '/main/{0}/{1}-plan/{2}/{3}/1/'
      .replace('{0}', remoteId('organization', organization, keyMap))
      .replace('{1}', typeName.toLowerCase())
      .replace('{2}', remoteId('project', project, keyMap))
      .replace('{3}', remoteId('plan', plan.id, keyMap)),
    planId: plan.id,
  };
};
