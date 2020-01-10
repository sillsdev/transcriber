import React, { Suspense } from 'react';
import Busy from '../components/Busy';

const LazyLoad = (props: any) => (Component: any) => (
  <>
    <Suspense fallback={<Busy />}>
      <Component {...props} />
    </Suspense>
  </>
);

export default LazyLoad;
