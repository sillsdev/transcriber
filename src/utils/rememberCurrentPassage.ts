import MemorySource from '@orbit/memory';
import { remoteIdNum } from '../crud';
import { LocalKey, localUserKey } from './localUserKey';
import { RecordKeyMap } from '@orbit/records';

export async function rememberCurrentPassage(
  memory: MemorySource,
  passageId: string
) {
  if (passageId) {
    const passageRemoteId =
      remoteIdNum('passage', passageId, memory?.keyMap as RecordKeyMap) ||
      passageId;
    localStorage.setItem(localUserKey(LocalKey.passage), `${passageRemoteId}`);
  } else {
    localStorage.removeItem(localUserKey(LocalKey.passage));
  }
}
