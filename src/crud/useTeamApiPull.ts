import JSONAPISource from '@orbit/jsonapi';
import { useGlobal } from 'reactn';

export const useTeamApiPull = () => {
  const [memory] = useGlobal('memory');
  const [coordinator] = useGlobal('coordinator');
  const remote = coordinator.getSource('remote') as JSONAPISource;

  const teamRead = async (id: string) => {
    if (remote)
      return await memory.sync(
        await remote.pull((q) => q.findRecord({ type: 'organization', id }))
      );
  };
  return teamRead;
};
