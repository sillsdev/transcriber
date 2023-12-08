import { useGlobal } from 'reactn';
import JSONAPISource from '@orbit/jsonapi';
import { pullRemoteToMemory } from './syncToMemory';

export const useLoadStatic = () => {
  const [memory] = useGlobal('memory');
  const [coordinator] = useGlobal('coordinator');
  const remote = coordinator.getSource('remote') as JSONAPISource;

  const loadStatic = async () => {
    if (!remote) return false;
    const tables = [
      'artifactcategory',
      'artifacttype',
      'passagetype',
      'plantype',
      'projecttype',
      'role',
      'integration',
      'workflowstep',
    ];
    for (const table of tables) {
      await pullRemoteToMemory({ table, memory, remote });
    }
    return true;
  };

  const checkStaticTables = async (version: string) => {
    if ((localStorage.getItem('static-tables') || '0') < version) {
      if (await loadStatic()) localStorage.setItem('static-tables', version);
    }
  };
  return { loadStatic, checkStaticTables };
};
