import { useRef, useEffect } from 'react';

export const useMounted = (title?:string) => {
  const mounted = useRef<Boolean>(false);

  const isMounted = () => {
    return mounted.current;
  }
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return isMounted;
};
