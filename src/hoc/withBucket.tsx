import React from 'react';
import { useGlobal } from 'reactn';

export const withBucket = (Component: any) => {
  return (props: any) => {
    const [bucket] = useGlobal('bucket');

    const resetRequests = () => {
      if (bucket) bucket.setItem('remote-requests', []);
    };

    return <Component resetRequests={resetRequests} {...props} />;
  };
};
