import React, { PropsWithChildren } from 'react';
import MemorySource from '@orbit/memory';
import { UninitializedRecord } from '@orbit/records';

type IRecs = UninitializedRecord[] | undefined;

interface IOrbitContext {
  memory: MemorySource;
  getRecs: (type: string) => IRecs;
  setRecs: (type: string, recs: IRecs) => void;
}

export const OrbitContext = React.createContext({} as IOrbitContext);

interface DataProviderProps extends PropsWithChildren {
  dataStore: MemorySource;
}

export const DataProvider = ({ dataStore, children }: DataProviderProps) => {
  const recMap = new Map<string, IRecs>();

  const getRecs = (type: string) => recMap.get(type);
  const setRecs = (type: string, recs: IRecs) => recMap.set(type, recs);

  return (
    <OrbitContext.Provider value={{ memory: dataStore, getRecs, setRecs }}>
      {children}
    </OrbitContext.Provider>
  );
};

export default DataProvider;
