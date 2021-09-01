import { useGlobal } from 'reactn';
import JSONAPISource from '@orbit/jsonapi';

export const useUpdateOrbitToken = () => {
  const [coordinator] = useGlobal('coordinator');
  const remote = coordinator.getSource('remote') as JSONAPISource;

  return (myToken: string) => {
    // Update the token in the orbit request processor
    const reqHeaders = remote.requestProcessor.defaultFetchSettings?.headers;
    remote.requestProcessor.defaultFetchSettings.headers = {
      ...reqHeaders,
      Authorization: 'Bearer ' + myToken,
    };
  };
};
