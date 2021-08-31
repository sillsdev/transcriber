import { useAuth0 } from '@auth0/auth0-react';
import { useGlobal } from 'reactn';
import Auth from '../auth/Auth';
import { isElectron } from '../api-variable';
import React from 'react';
import { LogLevel } from '@orbit/coordinator';

export const useLogout = (
  auth: Auth,
  setView?: React.Dispatch<React.SetStateAction<string>>
) => {
  const { logout } = useAuth0();
  const [coordinator] = useGlobal('coordinator');
  const [, setUser] = useGlobal('user');
  const [, setIsOffline] = useGlobal('offline');
  const [offlineOnly, setOfflineOnly] = useGlobal('offlineOnly');

  const handleLogout = async () => {
    const wasOfflineOnly = offlineOnly;
    if (offlineOnly) setOfflineOnly(false);
    setUser('');

    if (auth.accessToken) {
      localStorage.removeItem('isLoggedIn');
      setIsOffline(isElectron);
      if (isElectron && coordinator?.sourceNames.includes('remote')) {
        await coordinator.deactivate();
        coordinator.removeStrategy('remote-push-fail');
        coordinator.removeStrategy('remote-pull-fail');
        coordinator.removeStrategy('remote-request');
        coordinator.removeStrategy('remote-update');
        coordinator.removeStrategy('remote-sync');
        coordinator.removeSource('remote');
        await coordinator.activate({ logLevel: LogLevel.Warnings });
      }
      auth.logout();
      !isElectron && logout();
    }
    setView && setView(wasOfflineOnly ? 'offline' : 'online');
  };

  return () => {
    if (!isElectron) {
      auth.logout();
      logout();
    } else handleLogout();
  };
};
