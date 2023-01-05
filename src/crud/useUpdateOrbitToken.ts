import { useGlobal } from '../mods/reactn';
import JSONAPISource from '@orbit/jsonapi';

export const useUpdateOrbitToken = () => {
  const [coordinator] = useGlobal('coordinator');
  const remote = coordinator.getSource('remote') as JSONAPISource;

  return (myToken: string) => {
    // Update the token in the orbit request processor
    const reqHeaders = remote?.requestProcessor.defaultFetchSettings?.headers;
    if (reqHeaders)
      remote.requestProcessor.defaultFetchSettings.headers = {
        ...reqHeaders,
        Authorization: 'Bearer ' + myToken,
      };
  };
};
