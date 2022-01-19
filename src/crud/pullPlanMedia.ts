import Memory from '@orbit/memory';
import JSONAPISource from '@orbit/jsonapi';
import { remoteIdNum } from '.';

export const pullPlanMedia = async (
  plan: string,
  memory: Memory,
  remote: JSONAPISource
) => {
  const getPlanId = () => remoteIdNum('plan', plan, memory.keyMap) || plan;

  const planId = getPlanId();
  if (planId !== undefined) {
    var filterrec = {
      attribute: 'plan-id',
      value: planId,
    };
    var t = await remote.pull((q) =>
      q.findRecords('mediafile').filter(filterrec)
    );
    await memory.sync(t);
  }
};
