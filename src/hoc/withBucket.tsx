import React from 'react';
import { useGlobal } from 'reactn';

export const withBucket = (Component: any) => {
  return (props: any) => {
    const [remote] = useGlobal('remote');
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
