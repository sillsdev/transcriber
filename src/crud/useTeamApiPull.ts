import JSONAPISource from '@orbit/jsonapi';
import { useGlobal } from '../context/GlobalContext';
import { recToMemory } from './syncToMemory';

export const useTeamApiPull = () => {
  const [memory] = useGlobal('memory');
  const [coordinator] = useGlobal('coordinator');
  const remote = coordinator?.getSource('remote') as JSONAPISource;

  const teamRead = async (id: string) => {
    if (remote)
      return await recToMemory({
        recId: { type: 'organization', id },
        memory,
        remote,
      });
  };
  return teamRead;
};
