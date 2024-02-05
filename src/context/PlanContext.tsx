import React, { useEffect, useState } from 'react';
// see: https://upmostly.com/tutorials/how-to-use-the-usecontext-hook-in-react
import { useGlobal } from 'reactn';
import { shallowEqual } from 'react-redux';
import {
  IMainStrings,
  IProjButtonsStrings,
  ProjectD,
  MediaFile,
  Discussion,
  GroupMembership,
} from '../model';
import { findRecord, usePlanType, useRole } from '../crud';
import { useCheckOnline, useInterval } from '../utils';
import { useProjectDefaults } from '../crud/useProjectDefaults';
import { useOrbitData } from '../hoc/useOrbitData';
import { useSelector } from 'react-redux';
import { projButtonsSelector } from '../selector';

export const ProjectHidePublishing = 'hidePublishing';
export const ProjectFirstMovement = 'firstMovement';
export const SectionMap = 'sectionMap';

export interface IRowData {}

const initState = {
  t: {} as IMainStrings,
  readonly: false,
  connected: false,
  projButtonStr: {} as IProjButtonsStrings,
  mediafiles: [] as MediaFile[],
  discussions: [] as Discussion[],
  groupmemberships: [] as GroupMembership[],
  scripture: false,
  flat: false,
  shared: false,
  canHidePublishing: true,
  hidePublishing: true,
  sectionArr: [] as [number, string][],
  setSectionArr: (sectionArr: [number, string][]) => {},
  togglePublishing: () => {},
  setCanPublish: (canPublish: boolean) => {},
};

export type ICtxState = typeof initState;

interface IContext {
  state: ICtxState;
  setState: React.Dispatch<React.SetStateAction<ICtxState>>;
}

const PlanContext = React.createContext({} as IContext);

interface IProps {
  children: React.ReactElement;
}

const PlanProvider = (props: IProps) => {
  const mediafiles = useOrbitData<MediaFile[]>('mediafile');
  const discussions = useOrbitData<Discussion[]>('discussion');
  const groupmemberships = useOrbitData<GroupMembership[]>('groupmembership');
  const projButtonStr: IProjButtonsStrings = useSelector(
    projButtonsSelector,
    shallowEqual
  );
  const [memory] = useGlobal('memory');
  const [plan] = useGlobal('plan');
  const [project] = useGlobal('project');
  const [connected] = useGlobal('connected');
  const [isOffline] = useGlobal('offline');
  const [offlineOnly] = useGlobal('offlineOnly');
  const [isDeveloper] = useGlobal('developer');
  const getPlanType = usePlanType();
  const { userIsAdmin } = useRole();
  const { setProjectDefault, getProjectDefault } = useProjectDefaults();
  const [readonly, setReadOnly] = useState(
    (isOffline && !offlineOnly) || !userIsAdmin
  );
  const [state, setState] = useState({
    ...initState,
    projButtonStr,
    mediafiles,
    discussions,
    groupmemberships,
  });
  const checkOnline = useCheckOnline();

  const getSectionMap = () => {
    return getProjectDefault(SectionMap) as [number, string][] | undefined;
  }

  const setSectionArr = (newArr: [number, string][]) => {
    setProjectDefault(SectionMap, newArr);
  };

  useEffect(() => {
    const { scripture, flat } = getPlanType(plan);
    if (flat !== state.flat || scripture !== state.scripture)
      setState((state) => ({ ...state, flat, scripture }));
    // setSectionArr([]);
    // console.log('PlanContext: plan changed')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan]);

  useEffect(() => {
    let projRec = findRecord(memory, 'project', project) as ProjectD;
    if (projRec) {
      const shared = projRec?.attributes?.isPublic || false;
      const hidePublishing =
        (getProjectDefault(ProjectHidePublishing) ?? true) ||
        (isOffline && !isDeveloper) ||
        shared;

      if (
        shared !== state.shared ||
        hidePublishing !== state[ProjectHidePublishing]
      ) {
        setState((state) => ({
          ...state,
          shared,
          hidePublishing,
        }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project]);

  const setCanPublish = (canHidePublishing: boolean) => {
    setState((state) => ({ ...state, canHidePublishing }));
  };

  const togglePublishing = () => {
    const { hidePublishing } = state;
    setProjectDefault(ProjectHidePublishing, !hidePublishing);
    setState((state) => ({ ...state, hidePublishing: !hidePublishing }));
  };

  React.useEffect(() => {
    const newValue = (isOffline && !offlineOnly) || !userIsAdmin;
    if (readonly !== newValue) setReadOnly(newValue);
  }, [userIsAdmin, isOffline, offlineOnly, readonly]);

  //do this every 30 seconds to warn they can't save
  useInterval(
    () => checkOnline((result: boolean) => {}),
    isOffline ? null : 1000 * 30
  );

  return (
    <PlanContext.Provider
      value={{
        state: {
          ...state,
          sectionArr: getSectionMap() ?? [],
          setSectionArr,
          connected,
          readonly,
          togglePublishing,
          setCanPublish,
        },
        setState,
      }}
    >
      {props.children}
    </PlanContext.Provider>
  );
};

export { PlanContext, PlanProvider };
