import React, { useState, ReactNode, useContext } from 'react';
import Coordinator from '@orbit/coordinator';
import Memory from '@orbit/memory';
import { AlertSeverity } from '../hoc/SnackBar';
import { RoleNames } from '../model';

// see: https://upmostly.com/tutorials/how-to-use-the-usecontext-hook-in-react

export interface GlobalState {
  home: boolean;
  organization: string;
  orgRole: RoleNames | undefined;
  project: string;
  projType: string;
  plan: string;
  tab: number;
  user: string;
  lang: string;
  coordinator: Coordinator;
  memory: Memory;
  remoteBusy: boolean;
  dataChangeCount: number;
  saveResult: string | undefined;
  snackMessage: JSX.Element;
  snackAlert: AlertSeverity | undefined;
  changed: boolean;
  projectsLoaded: string[];
  loadComplete: boolean;
  importexportBusy: boolean;
  autoOpenAddMedia: boolean; // open a dialog
  editUserId: string | null;
  developer: string | null;
  offline: boolean;
  errorReporter: any; // bugsnagClient
  alertOpen: boolean;
  fingerprint: string;
  orbitRetries: number;
  enableOffsite: boolean;
  connected: boolean;
  offlineOnly: boolean;
  latestVersion: string;
  releaseDate: string;
  progress: number;
}

export interface GlobalCtxType {
  globalState: GlobalState;
  setGlobalState: React.Dispatch<React.SetStateAction<GlobalState>>;
}

const GlobalContext = React.createContext<GlobalCtxType | undefined>(undefined);

export const useGlobal = <K extends keyof GlobalState>(
  prop?: K
): [GlobalState[K], (s: GlobalState[K]) => void] => {
  const { globalState, setGlobalState } = useContext(
    GlobalContext
  ) as GlobalCtxType;

  if (globalState === undefined) return [undefined, undefined] as any;

  if (prop === undefined) return [globalState, setGlobalState] as any;

  const setter = (val: GlobalState[K]) => {
    if (val === globalState[prop]) return; // ignore set to same value
    setGlobalState((s) => ({ ...s, [prop]: val }));
  };

  return [globalState[prop], setter];
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
