import { useGlobal } from 'reactn';
import JSONAPISource from '@orbit/jsonapi';

export const useLoadStatic = () => {
  const [memory] = useGlobal('memory');
  const [coordinator] = useGlobal('coordinator');
  const remote = coordinator.getSource('remote') as JSONAPISource;

  const loadStatic = async () => {
    if (!remote) return false;
    await memory.sync(
      await remote.pull((q) => q.findRecords('artifactcategory'))
    );
    await memory.sync(await remote.pull((q) => q.findRecords('artifacttype')));
    await memory.sync(await remote.pull((q) => q.findRecords('plantype')));
    await memory.sync(await remote.pull((q) => q.findRecords('projecttype')));
    await memory.sync(await remote.pull((q) => q.findRecords('role')));
    await memory.sync(await remote.pull((q) => q.findRecords('integration')));
    await memory.sync(await remote.pull((q) => q.findRecords('workflowstep')));

    return true;
  };

  const checkStaticTables = async (version: string) => {
    if ((localStorage.getItem('static-tables') || '0') < version) {
      if (await loadStatic()) localStorage.setItem('static-tables', version);
    }
  };
  return { loadStatic, checkStaticTables };
};
