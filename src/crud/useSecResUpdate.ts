import { useGlobal } from '../context/GlobalContext';
import { SectionResourceD } from '../model';
import { UpdateRecord } from '../model/baseModel';

export const useSecResUpdate = () => {
  const [memory] = useGlobal('memory');
  const [user] = useGlobal('user');

  return async (secResRec: SectionResourceD) => {
    await memory.update((t) => UpdateRecord(t, secResRec, user));
  };
};
