import { useGlobal } from '../context/GlobalContext';
import { Passage } from '../model';

export const usePassageRec = () => {
  const [memory] = useGlobal('memory');

  return (passageid: string) => {
    return memory?.cache.query((q) =>
      q.findRecord({ type: 'passage', id: passageid })
    ) as Passage;
  };
};
