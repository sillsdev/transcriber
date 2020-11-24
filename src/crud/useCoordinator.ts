import { useGlobal } from 'reactn';

export const useCoordinator = () => {
  const [offline] = useGlobal('offline');
  const [offlineCoordinator] = useGlobal('offlineCoordinator');
  const [onlineCoordinator] = useGlobal('onlineCoordinator');

  return offline ? offlineCoordinator : onlineCoordinator;
};
