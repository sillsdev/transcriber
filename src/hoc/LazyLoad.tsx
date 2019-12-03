import React, { Suspense } from 'react';

const LazyLoad = (props: any) => (Component: any) => (
  <>
    <Suspense fallback={<div>Loading...</div>}>
      <Component {...props} />
    </Suspense>
  </>
);

export default LazyLoad;
