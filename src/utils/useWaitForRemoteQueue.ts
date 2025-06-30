import { useGetGlobal, useGlobal } from '../context/GlobalContext';
import { waitForIt } from './waitForIt';
import { useCheckOnline } from './useCheckOnline';

export const useWaitForRemoteQueue = (source?: string) => {
  const [coordinator] = useGlobal('coordinator');
  const remote = coordinator.getSource(source ?? 'remote');
  const [offlineOnly] = useGlobal('offlineOnly'); //verified this is not used in a function 2/18/25
  const checkOnline = useCheckOnline(
    'Wait for remote queue' + (offlineOnly ? ' (offline only)' : '')
  );
  const getGlobal = useGetGlobal();

  return async (label: string) => {
    var firstTry = true;
    const checkIt = () => {
      var online = getGlobal('connected');
      if (remote && remote.requestQueue.length > 0 && firstTry) {
        //this adds a query to the remote queue...shooting ourselves in the foot here, so just double check online status once
        checkOnline((connected: boolean) => {
          online = connected;
        }, true);
        firstTry = false;
      }
      return !remote || !online || remote.requestQueue.length === 0;
    };
    await waitForIt(
      label,
      () => checkIt(),
      () => getGlobal('offline') && !getGlobal('offlineOnly'),
      2000
    );
  };
};
