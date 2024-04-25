import JSONAPISource from '@orbit/jsonapi';
import { Resource } from '../model';
import { useGlobal } from 'reactn';

export const useAllSharedResourceRead = () => {
  const [coordinator] = useGlobal('coordinator');
  const remote = coordinator.getSource('remote') as JSONAPISource;

  return async () => {
    if (remote)
      return (await remote.query((q) =>
        q.findRecords('resource')
      )) as Resource[];
    else return [] as Resource[];
  };
};
