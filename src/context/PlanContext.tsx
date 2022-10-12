import React, { useEffect, useState } from 'react';
// see: https://upmostly.com/tutorials/how-to-use-the-usecontext-hook-in-react
import { useGlobal } from 'reactn';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import {
  IState,
  IMainStrings,
  IProjButtonsStrings,
  Project,
  RoleNames,
  MediaFile,
  Discussion,
  GroupMembership,
} from '../model';
import localStrings from '../selector/localize';
import { withData } from '../mods/react-orbitjs';
import { QueryBuilder } from '@orbit/data';
import { usePlanType } from '../crud';
import { useCheckOnline, useInterval } from '../utils';
import * as actions from '../store';

interface IStateProps {
  projButtonStr: IProjButtonsStrings;
}
const mapStateToProps = (state: IState): IStateProps => ({
  projButtonStr: localStrings(state, { layout: 'projButtons' }),
});

interface IDispatchProps {
  resetOrbitError: typeof actions.resetOrbitError;
}
const mapDispatchToProps = (dispatch: any): IDispatchProps => ({
  ...bindActionCreators({ resetOrbitError: actions.resetOrbitError }, dispatch),
});

interface IRecordProps {
  mediafiles: MediaFile[];
  discussions: Discussion[];
  groupmemberships: GroupMembership[];
}
const mapRecordsToProps = {
  mediafiles: (q: QueryBuilder) => q.findRecords('mediafile'),
  discussions: (q: QueryBuilder) => q.findRecords('discussion'),
  groupmemberships: (q: QueryBuilder) => q.findRecords('groupmembership'),
};

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
};

export type ICtxState = typeof initState;

interface IContext {
  state: ICtxState;
  setState: React.Dispatch<React.SetStateAction<ICtxState>>;
}

const PlanContext = React.createContext({} as IContext);

interface IProps extends IStateProps, IDispatchProps, IRecordProps {
  children: React.ReactElement;
}

const PlanProvider = withData(mapRecordsToProps)(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )((props: IProps) => {
    const {
      projButtonStr,
      mediafiles,
      discussions,
      groupmemberships,
      resetOrbitError,
    } = props;
    const [memory] = useGlobal('memory');
    const [plan] = useGlobal('plan');
    const [project] = useGlobal('project');
    const [connected] = useGlobal('connected');
    const [projRole] = useGlobal('projRole');
    const [isOffline] = useGlobal('offline');
    const [offlineOnly] = useGlobal('offlineOnly');
    const getPlanType = usePlanType();
    const [readonly, setReadOnly] = useState(
      (isOffline && !offlineOnly) || projRole !== RoleNames.Admin
    );
    const [state, setState] = useState({
      ...initState,
      projButtonStr,
      mediafiles,
      discussions,
      groupmemberships,
    });
    const checkOnline = useCheckOnline(resetOrbitError);

    useEffect(() => {
      const { scripture, flat } = getPlanType(plan);
      if (flat !== state.flat || scripture !== state.scripture)
        setState((state) => ({ ...state, flat, scripture }));
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [plan]);

    useEffect(() => {
      let projRec: Project | null = null;
      if (project && project !== '')
        projRec = memory.cache.query((q: QueryBuilder) =>
          q.findRecord({ type: 'project', id: project })
        ) as Project;
      if (projRec !== null && projRec.attributes.isPublic !== state.shared)
        setState((state) => ({
          ...state,
          shared: projRec?.attributes.isPublic || false,
        }));
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [project]);

    React.useEffect(() => {
      const newValue =
        (isOffline && !offlineOnly) || projRole !== RoleNames.Admin;
      if (readonly !== newValue) setReadOnly(newValue);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projRole]);

    //do this every 30 seconds to warn they can't save
    useInterval(
      () => checkOnline((result: boolean) => {}),
      offlineOnly ? null : 1000 * 30
    );

    return (
      <PlanContext.Provider
        value={{
          state: {
            ...state,
            connected,
            readonly,
          },
          setState,
        }}
      >
        {props.children}
      </PlanContext.Provider>
    );
  })
);

export { PlanContext, PlanProvider };
