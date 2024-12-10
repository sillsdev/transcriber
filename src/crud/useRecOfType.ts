import { InitializedRecord } from '@orbit/records';
import { useGlobal } from '../context/GlobalContext';

export const useRecOfType = () => {
  const [memory] = useGlobal('memory');

  return (recType: string) =>
    (
      memory?.cache.query((q) => q.findRecords(recType)) as InitializedRecord[]
    )?.filter((r) => r.attributes);
};
