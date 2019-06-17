import { keyMap } from '../schema';
import { KeyMap } from '@orbit/data';

const remoteId = (table: string, localId: string) => parseInt((keyMap as KeyMap).idToKey(table, 'remoteId', localId));
export default remoteId;
