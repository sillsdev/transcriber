import { useRef, useLayoutEffect, useMemo } from 'react';
import { ReactIsInDevelomentMode } from './ReactIsInDevelopmentMode';

export const useMounted = (title?: string) => {
  const mounted = useRef(0);

  const isDev = useMemo(() => ReactIsInDevelomentMode(), []);

  const isMounted = () => {
    return mounted.current > (isDev ? 1 : 0);
  };
  useLayoutEffect(() => {
    mounted.current += 1;
    return () => {
      if (!isDev || mounted.current > 1) {
        mounted.current = 0;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return isMounted;
};
