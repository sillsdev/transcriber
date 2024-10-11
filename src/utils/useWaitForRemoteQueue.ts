import { useGlobal } from 'reactn';
import { waitForIt } from './waitForIt';
import { useCheckOnline } from './useCheckOnline';

export const useWaitForRemoteQueue = () => {
  const [connected] = useGlobal('connected');
  const [coordinator] = useGlobal('coordinator');
  const remote = coordinator.getSource('remote');
  const [offline] = useGlobal('offline');
  const [offlineOnly] = useGlobal('offlineOnly');
  const checkOnline = useCheckOnline(
    'Wait for remote queue' + (offlineOnly ? ' (offline only)' : '')
  );

  return async (label: string) => {
    var firstTry = true;
    const checkIt = () => {
      var online = connected;
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
      () => offline && !offlineOnly,
      200
    );
  };
};
