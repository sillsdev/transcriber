import { QueryBuilder } from '@orbit/data';
import { useGlobal } from 'reactn';
import { Passage } from '../model';

export const usePassageRec = () => {
  const [memory] = useGlobal('memory');

  return (passageid: string) => {
    return memory.cache.query((q: QueryBuilder) =>
      q.findRecord({ type: 'passage', id: passageid })
    ) as Passage;
  };
};
