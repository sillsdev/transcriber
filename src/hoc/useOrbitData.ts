import { useLayoutEffect, useContext, useState, useRef, useMemo } from 'react';
import { OrbitContext } from './DataProvider';
import { ReactIsInDevelomentMode } from '../utils/ReactIsInDevelopmentMode';
import { UninitializedRecord } from '@orbit/records';

export function useOrbitData<S extends UninitializedRecord[]>(
  model: string
): S {
  const { memory, getRecs, setRecs } = useContext(OrbitContext);
  const [newValue, setNewValue] = useState(0);
  const mounted = useRef(0);

  const isDev = useMemo(() => ReactIsInDevelomentMode(), []);

  const liveQuery = memory?.cache.liveQuery((q) => q.findRecords(model));

  const unsubscribe = liveQuery.subscribe((update) => {
    update && update.query();
    setRecs(model, undefined);
    setNewValue(newValue + 1);
  });

  // Only allow unsubscribe if actually unmounting
  useLayoutEffect(() => {
    mounted.current += 1;
    return () => {
      if (!isDev || mounted.current > 1) {
        unsubscribe();
        // setRecs(model, undefined);
        mounted.current = 0;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const current = getRecs(model);
  if (current) {
    return current as S;
  }
  const records = liveQuery.query() as S;
  setRecs(model, records);
  return records as S;
}
