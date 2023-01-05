import { LogLevel } from '@orbit/coordinator';
import { useContext } from 'react';
import { useGlobal } from '../mods/reactn';
import { isElectron } from '../api-variable';
import { TokenContext } from '../context/TokenProvider';

export const useLogoutResets = () => {
  const [, setUser] = useGlobal('user');
  const [, setIsOffline] = useGlobal('offline');
  const [coordinator] = useGlobal('coordinator');
  const ctx = useContext(TokenContext).state;

  return async () => {
    if (isElectron) setUser('');
    if (ctx.accessToken) {
      localStorage.removeItem('isLoggedIn');
      if (isElectron) {
        setIsOffline(isElectron);
        if (coordinator?.sourceNames.includes('remote')) {
          await coordinator.deactivate();
          coordinator.removeStrategy('remote-push-fail');
          coordinator.removeStrategy('remote-pull-fail');
          coordinator.removeStrategy('remote-request');
          coordinator.removeStrategy('remote-update');
          coordinator.removeStrategy('remote-sync');
          coordinator.removeSource('remote');
          await coordinator.activate({ logLevel: LogLevel.Warnings });
        }
      }
    }
  };
};
