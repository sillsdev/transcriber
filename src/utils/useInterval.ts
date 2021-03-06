// https://overreacted.io/making-setinterval-declarative-with-react-hooks/

import { useRef, useEffect } from 'react';

export const useInterval = (callback: () => void, delay: number | null) => {
  const savedCallback = useRef<() => void>();
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);
  useEffect(() => {
    function tick() {
      if (savedCallback.current) savedCallback.current();
    }
    if (delay != null) {
      if (savedCallback.current) savedCallback.current();
      let id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
    else if (savedCallback.current)
    {
      savedCallback.current = undefined;
    }
  }, [delay]);
};
