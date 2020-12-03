import { useRef, useEffect } from 'react';

export const useMounted = () => {
  const isMounted = useRef<Boolean>(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  return isMounted;
};
