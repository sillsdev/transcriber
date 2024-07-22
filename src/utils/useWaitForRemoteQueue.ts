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

  return async (label: string) =>
    waitForIt(
      label,
      () => {
        var online = connected;
        if (remote && remote.requestQueue.length > 0)
          checkOnline((connected: boolean) => {
            online = connected;
          }, true);
        return !remote || !online || remote.requestQueue.length === 0;
      },
      () => offline && !offlineOnly,
      200
    );
};
