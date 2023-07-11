import { TransformBuilder } from '@orbit/data';
import { useGlobal } from 'reactn';
import { UpdateRecord, BaseModel } from '../model/baseModel';

export const useUpdateRecord = () => {
  const [memory] = useGlobal('memory');
  const [user] = useGlobal('user');

  return (rec: BaseModel) => {
    memory.update((t: TransformBuilder) => UpdateRecord(t, rec, user));
  };
};
