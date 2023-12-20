import { useGlobal } from 'reactn';
import { SharedResourceD } from '../model';

export const useNotes = () => {
  const [memory] = useGlobal('memory');

  return () => {
    const sharedResources = memory.cache.query((q) =>
      q.findRecords('sharedresource')
    ) as SharedResourceD[];
    return sharedResources.filter((sr) => sr?.attributes?.note ?? false);
  };
};
