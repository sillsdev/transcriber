import React, { useState, ReactNode, useContext } from 'react';
import Coordinator from '@orbit/coordinator';
import Memory from '@orbit/memory';
import { AlertSeverity } from '../hoc/SnackBar';
import { RoleNames } from '../model';
import { debounce } from 'lodash';

// see: https://upmostly.com/tutorials/how-to-use-the-usecontext-hook-in-react

export interface GlobalState {
  //constants
  coordinator: Coordinator;
  errorReporter: any; // bugsnagClient
  fingerprint: string;
  memory: Memory;

  //effectively constant
  lang: string; //profile
  latestVersion: string;
  loadComplete: boolean; //Loading
  offlineOnly: boolean; //errorPage, access, logout
  organization: string; //Loading
  releaseDate: string;
  user: string; //loading, profile, welcome, logout

  //modified during execution
  alertOpen: boolean; //verified
  autoOpenAddMedia: boolean; //verified  // open a dialog
  changed: boolean; //verified //UnsavedContext
  connected: boolean; //verified //useCheckOnline
  dataChangeCount: number; //verified
  developer: string | null; //not verified but not userfacing
  enableOffsite: boolean; //verified
  home: boolean; //verified //TeamScreen, useHome
  importexportBusy: boolean; //verified
  orbitRetries: number; //verified
  orgRole: RoleNames | undefined; //verified //useRole, useTeamCreate, useHome
  plan: string; //verified
  progress: number; //verified
  project: string; //verified //AppHead, useUrlContext, Loading, TeamScreen
  projectsLoaded: string[]; //verified
  projType: string; //verified //useHome, useProjectType
  remoteBusy: boolean; //verified //datachanges, unsavedcontext, teamactions,consultantcheck, audiotable
  saveResult: string | undefined; //verified //PassageDetailContext, UnsavedContext
  snackAlert: AlertSeverity | undefined; //verified //SnackBar
  snackMessage: JSX.Element; //verified //SnackBar
  offline: boolean;
}

export type GlobalKey = keyof GlobalState;
export type GetGlobalType = <K extends GlobalKey>(prop: K) => GlobalState[K];

export interface GlobalCtxType {
  globalState: GlobalState;
  setGlobalState: React.Dispatch<React.SetStateAction<GlobalState>>;
}

const GlobalContext = React.createContext<GlobalCtxType | undefined>(undefined);

const changes = {} as GlobalState;

export const useGlobal = <K extends GlobalKey>(
  prop?: K
): [GlobalState[K], (val: GlobalState[K]) => void] => {
  const { globalState, setGlobalState } = useContext(
    GlobalContext
  ) as GlobalCtxType;

  if (globalState === undefined || prop === undefined)
    return [undefined, undefined] as any;

  // if (prop === undefined) return [globalState, setGlobalState] as any;

  const handleChange = debounce(() => {
    setGlobalState((state) => ({ ...state, ...changes }));
  }, 100);

  const setter = (val: GlobalState[K]) => {
    if (val === (changes[prop] ?? globalState[prop])) return; // ignore set to same value
    changes[prop] = val; // keep track of all changes
    handleChange(); // post them as react can handle them
  };
  return [changes[prop] ?? globalState[prop], setter];
};

export const useGetGlobal = (): GetGlobalType => {
  const { globalState } = useContext(GlobalContext) as GlobalCtxType;
  return (prop) => {
    // console.log(`useGetGlobal ${prop} is ${changes[prop]}`);
    return changes[prop] ?? globalState[prop];
  };
};

interface GlobalProps {
  init: GlobalState;
  children: ReactNode;
}

const GlobalProvider: React.FC<GlobalProps> = ({ init, children }) => {
  const [globalState, setGlobalState] = useState<GlobalState>(init);

  return (
    <GlobalContext.Provider value={{ globalState, setGlobalState }}>
      {children}
    </GlobalContext.Provider>
  );
};

export { GlobalContext, GlobalProvider };
