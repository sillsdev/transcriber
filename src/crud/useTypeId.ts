import { useGlobal } from '../context/GlobalContext';
import { InitializedRecord } from '@orbit/records';

export const useTypeId = () => {
  const [memory] = useGlobal('memory');
  const [isOfflineOnly] = useGlobal('offlineOnly');

  return (type: string, table: string) => {
    const ptRecs = memory?.cache.query((q) =>
      q.findRecords(`${table}type`)
    ) as InitializedRecord[];
    const selected = ptRecs.filter(
      (p) =>
        (p?.attributes?.name as string)?.toLowerCase() === type.toLowerCase() &&
        Boolean(p?.keys?.remoteId) !== isOfflineOnly
    );
    return selected.length > 0 ? selected[0].id : '';
  };
};
