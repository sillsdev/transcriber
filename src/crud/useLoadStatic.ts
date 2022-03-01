import { useGlobal } from 'reactn';
import JSONAPISource from '@orbit/jsonapi';

export const useLoadStatic = () => {
  const [memory] = useGlobal('memory');
  const [coordinator] = useGlobal('coordinator');
  const remote = coordinator.getSource('remote') as JSONAPISource;

  const loadStatic = async () => {
    await memory.sync(await remote.pull((q) => q.findRecords('workflowstep')));
    await memory.sync(
      await remote.pull((q) => q.findRecords('artifactcategory'))
    );
    await memory.sync(await remote.pull((q) => q.findRecords('artifacttype')));
    await memory.sync(await remote.pull((q) => q.findRecords('role')));
  };

  const checkStaticTables = async (version: string) => {
    if ((localStorage.getItem('static-tables') || '0') < version) {
      await loadStatic();
      localStorage.setItem('static-tables', version);
    }
  };
  return { loadStatic, checkStaticTables };
};
