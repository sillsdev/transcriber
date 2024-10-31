import { LogLevel } from '@orbit/coordinator';
import { useContext } from 'react';
import { useGlobal } from 'reactn';
import { isElectron } from '../api-variable';
import { TokenContext } from '../context/TokenProvider';
import { LocalKey } from './localUserKey';

export const useLogoutResets = () => {
  const [, setUser] = useGlobal('user');
  const [, setIsOffline] = useGlobal('offline');
  const [coordinator] = useGlobal('coordinator');
  const ctx = useContext(TokenContext).state;

  return async () => {
    if (ctx.accessToken && localStorage.getItem(LocalKey.loggedIn)) {
      localStorage.removeItem(LocalKey.loggedIn);
      if (isElectron) {
        setIsOffline(isElectron);
        if (coordinator?.sourceNames.includes('remote')) {
          await coordinator.deactivate();
          coordinator.removeStrategy('remote-query-fail');
          coordinator.removeStrategy('remote-update-fail');
          coordinator.removeStrategy('remote-request');
          coordinator.removeStrategy('remote-update');
          coordinator.removeStrategy('remote-sync');
          coordinator.removeSource('remote');
          await coordinator.activate({ logLevel: LogLevel.Warnings });
        }
      }
    }
    if (isElectron) setUser('');
  };
};
