import JSONAPISource from '@orbit/jsonapi';
import { useGlobal } from 'reactn';
import { Organization } from '../model';

export const useTeamApiRead = () => {
  const [memory] = useGlobal('memory');
  const [coordinator] = useGlobal('coordinator');
  const remote = coordinator.getSource('remote') as JSONAPISource;

  const teamRead = async (id: string) => {
    await memory.sync(
      await remote.pull((q) => q.findRecord({ type: 'organization', id }))
    );
    return (await memory.query((q) =>
      q.findRecord({ type: 'organization', id })
    )) as Promise<Organization>;
  };
  return teamRead;
};
