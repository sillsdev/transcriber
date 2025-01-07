import { useGlobal } from '../context/GlobalContext';
import { SharedResourceD } from '../model';
import related from './related';

export const useSharedResRead = () => {
  const [memory] = useGlobal('memory');

  return (passId: string) => {
    const sharedResources = memory?.cache.query((q) =>
      q.findRecords('sharedresource')
    ) as SharedResourceD[];
    const selected = sharedResources.filter(
      (sr) => related(sr, 'passage') === passId
    );
    return selected.length > 0 ? selected[0] : undefined;
  };
};
