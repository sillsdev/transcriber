import { useGlobal } from '../context/GlobalContext';
import { SharedResourceReferenceD } from '../model';
import related from './related';

export const useShaRefRead = () => {
  const [memory] = useGlobal('memory');

  return (resId: string) => {
    const sharedResourceReferences = memory?.cache.query((q) =>
      q.findRecords('sharedresourcereference')
    ) as SharedResourceReferenceD[];
    const selected = sharedResourceReferences.filter(
      (sr) => related(sr, 'sharedResource') === resId
    );
    return selected;
  };
};
