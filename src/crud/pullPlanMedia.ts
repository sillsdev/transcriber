import Memory from '@orbit/memory';
import JSONAPISource from '@orbit/jsonapi';
import { remoteIdNum } from '.';
import { RecordKeyMap } from '@orbit/records';
import { pullRemoteToMemory } from './syncToMemory';

export const pullPlanMedia = async (
  plan: string,
  memory: Memory,
  remote: JSONAPISource
) => {
  const getPlanId = () =>
    remoteIdNum('plan', plan, memory?.keyMap as RecordKeyMap) || plan;

  const planId = getPlanId();
  if (planId !== undefined) {
    const filter = [{ attribute: 'plan-id', value: planId }];
    await pullRemoteToMemory({ table: 'mediafile', memory, remote, filter });
  }
};
