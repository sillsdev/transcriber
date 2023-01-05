import React from 'react';
import { useGlobal } from '../mods/reactn';
import JSONAPISource from '@orbit/jsonapi';

export const withBucket = (Component: any) => {
  return (props: any) => {
    const [coordinator] = useGlobal('coordinator');
    const remote = coordinator.getSource('remote') as JSONAPISource;
    const resetRequests = () => {
      return remote.requestQueue.clear();
    };

    const isRequestQueueEmpty = () => {
      return remote.requestQueue.empty;
    };

    return (
      <Component
        resetRequests={resetRequests}
        isRequestQueueEmpty={isRequestQueueEmpty}
        {...props}
      />
    );
  };
};
