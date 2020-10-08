import React, { useState } from 'react';
// see: https://upmostly.com/tutorials/how-to-use-the-usecontext-hook-in-react
import { useGlobal } from 'reactn';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import {
  IState,
  IMainStrings,
  Plan,
  PlanType,
  IProjButtonsStrings,
} from '../model';
import localStrings from '../selector/localize';
import { withData } from '../mods/react-orbitjs';
import { QueryBuilder } from '@orbit/data';
import { related } from '../crud';

interface IStateProps {
  projButtonStr: IProjButtonsStrings;
}
const mapStateToProps = (state: IState): IStateProps => ({
  projButtonStr: localStrings(state, { layout: 'projButtons' }),
});

interface IDispatchProps {}
const mapDispatchToProps = (dispatch: any): IDispatchProps => ({
  ...bindActionCreators({}, dispatch),
});

interface IRecordProps {}
const mapRecordsToProps = {};

export interface IRowData {}

const initState = {
  t: {} as IMainStrings,
  projButtonStr: {} as IProjButtonsStrings,
  isScripture: () => false,
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
    const { projButtonStr } = props;
    const [memory] = useGlobal('memory');
    const [plan] = useGlobal('plan');
    const [state, setState] = useState({
      ...initState,
      projButtonStr,
    });

    const isScripture = () => {
      const planRecs = (memory.cache.query((q: QueryBuilder) =>
        q.findRecords('plan')
      ) as Plan[]).filter((p) => p.id === plan);
      if (planRecs.length > 0) {
        const typeId = related(planRecs[0], 'plantype');
        const typeRecs = (memory.cache.query((q: QueryBuilder) =>
          q.findRecords('plantype')
        ) as PlanType[]).filter((pt) => pt.id === typeId);
        if (typeRecs.length > 0) {
          return (
            typeRecs[0]?.attributes?.name
              ?.toLowerCase()
              ?.indexOf('scripture') !== -1
          );
        }
      }
      return false;
    };

    return (
      <PlanContext.Provider
        value={{
          state: {
            ...state,
            isScripture,
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
