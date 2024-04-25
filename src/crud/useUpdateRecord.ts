import { useGlobal } from 'reactn';
import { BaseModel, UpdateRecord } from '../model/baseModel';
import { InitializedRecord } from '@orbit/records';

export const useUpdateRecord = () => {
  const [memory] = useGlobal('memory');
  const [user] = useGlobal('user');

  return async (rec: BaseModel & InitializedRecord) => {
    await memory.update((t) => UpdateRecord(t, rec, user));
  };
};
