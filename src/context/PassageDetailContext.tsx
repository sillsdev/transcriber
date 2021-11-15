import React, { useState, useEffect, useRef } from 'react';
// see: https://upmostly.com/tutorials/how-to-use-the-usecontext-hook-in-react
import { useGlobal } from 'reactn';
import { useParams } from 'react-router-dom';
import { connect } from 'react-redux';
import {
  IState,
  Plan,
  MediaFile,
  ISharedStrings,
  IPassageDetailPlayerStrings,
} from '../model';
import localStrings from '../selector/localize';
import { withData } from '../mods/react-orbitjs';
import { QueryBuilder } from '@orbit/data';
import { remoteId, useFetchMediaUrl, MediaSt, usePlan } from '../crud';
import StickyRedirect from '../components/StickyRedirect';
import { loadBlob, logError, Severity } from '../utils';
import Auth from '../auth/Auth';
import { useSnackBar } from '../hoc/SnackBar';

export const getPlanName = (plan: Plan) => {
  return plan.attributes ? plan.attributes.name : '';
};

interface IStateProps {
  playerStr: IPassageDetailPlayerStrings;
  sharedStr: ISharedStrings;
}
const mapStateToProps = (state: IState): IStateProps => ({
  playerStr: localStrings(state, { layout: 'passageDetailPlayer' }),
  sharedStr: localStrings(state, { layout: 'shared' }),
});
/*
interface IDispatchProps {
  fetchBooks: typeof actions.fetchBooks;
}
const mapDispatchToProps = (dispatch: any): IDispatchProps => ({
  ...bindActionCreators(
    {
      fetchBooks: actions.fetchBooks,
    },
    dispatch
  ),
});
*/
interface IRecordProps {
  mediafiles: MediaFile[];
}

const mapRecordsToProps = {
  mediafiles: (q: QueryBuilder) => q.findRecords('mediafile'),
};

export interface IRowData {
  planName: string;
  planType: string;
  mediafile: MediaFile;
  playItem: string;
  artifactName: string;
  artifactType: string;
  artifactCategory: string;
}

const initState = {
  index: 0,
  selected: '',
  setSelected: (selected: string) => {},
  playing: false,
  setPlaying: (playing: boolean) => {},
  rowData: Array<IRowData>(),
  playItem: '',
  refresh: () => {},
  playerStr: {} as IPassageDetailPlayerStrings,
  sharedStr: {} as ISharedStrings,
  loading: false,
  hasUrl: false,
  mediaUrl: '',
  audioBlob: undefined as Blob | undefined,
  pdBusy: false,
  setPDBusy: (pdBusy: boolean) => {},
};

export type ICtxState = typeof initState;

interface IContext {
  state: ICtxState;
  setState: React.Dispatch<React.SetStateAction<ICtxState>>;
}

const PassageDetailContext = React.createContext({} as IContext);

interface IProps extends IStateProps, IRecordProps {
  //, IDispatchProps {
  children: React.ReactElement;
  auth: Auth;
}
interface ParamTypes {
  prjId: string;
  pasId: string;
  mediaId: string;
}
const PassageDetailProvider = withData(mapRecordsToProps)(
  connect(
    mapStateToProps
    //mapDispatchToProps
  )((props: IProps) => {
    const [reporter] = useGlobal('errorReporter');
    const { mediafiles } = props;
    const { playerStr, sharedStr } = props;
    const { prjId, pasId, mediaId } = useParams<ParamTypes>();
    const [memory] = useGlobal('memory');
    const [user] = useGlobal('user');
    const [project] = useGlobal('project');
    const [devPlan] = useGlobal('plan');
    const { getPlan } = usePlan();
    const [projRole] = useGlobal('projRole');
    const [errorReporter] = useGlobal('errorReporter');
    const view = React.useRef('');
    const [refreshed, setRefreshed] = useState(0);
    const mediaUrlRef = useRef('');
    const { showMessage } = useSnackBar();
    const [trackedTask, setTrackedTask] = useGlobal('trackedTask');
    const [state, setState] = useState({
      ...initState,
      playerStr,
    });
    const { fetchMediaUrl, mediaState } = useFetchMediaUrl(reporter);
    const fetching = useRef('');

    const setRows = (rowData: IRowData[]) => {
      setState((state: ICtxState) => {
        return { ...state, rowData, playing: false };
      });
    };

    const setPlaying = (playing: boolean) => {
      setState((state: ICtxState) => {
        return { ...state, playing };
      });
    };

    const setPDBusy = (busy: boolean) => {
      setState((state: ICtxState) => {
        return {
          ...state,
          pdBusy: busy,
        };
      });
    };
    const setSelected = (
      selected: string,
      rowData: IRowData[] = state.rowData
    ) => {
      const i = rowData.findIndex((r) => r.mediafile.id === selected);
      if (i < 0) return;
      const r = rowData[i];
      if (state.index !== i || state.selected !== selected) {
        const remId =
          remoteId('mediafile', selected, memory.keyMap) || selected;
        if (mediaId !== remId) {
          view.current = `/work/${prjId}/${pasId}/${remId}`;
        }
        setTrackedTask(selected);
        var resetBlob = false;
        if (
          mediaState.urlMediaId !== r.mediafile.id &&
          fetching.current !== r.mediafile.id
        ) {
          fetching.current = r.mediafile.id;
          fetchMediaUrl({
            id: r.mediafile.id,
            auth: props.auth,
          });
          resetBlob = true;
        }
        setState((state: ICtxState) => {
          return {
            ...state,
            audioBlob: resetBlob ? undefined : state.audioBlob,
            index: i,
            selected,
            playing: false,
            playItem: r.mediafile.id,
            loading: fetching.current !== '',
          };
        });
      }
    };

    const refresh = () => {
      setRefreshed((refreshed) => {
        return refreshed + 1;
      });
    };

    useEffect(() => {
      if (mediaState.url) {
        mediaUrlRef.current = mediaState.url;
        fetching.current = '';
        try {
          loadBlob(mediaState.url, (urlOrError, b) => {
            if (!b) {
              if (urlOrError.includes('403')) {
                //force requery for new media url
                setSelected(state.selected);
              } else {
                //no blob
                showMessage(urlOrError);
                setState((state: ICtxState) => {
                  return {
                    ...state,
                    loading: false,
                    audioBlob: undefined,
                    playing: false,
                  };
                });
              }
              return;
            }
            //not sure what this intermediary file is, but causes console errors
            if (b.type !== 'text/html') {
              if (urlOrError === mediaUrlRef.current) {
                setState((state: ICtxState) => {
                  return {
                    ...state,
                    loading: false,
                    audioBlob: b,
                    playing: false,
                  };
                });
              }
            }
          });
        } catch (e: any) {
          logError(Severity.error, errorReporter, e);
          showMessage(e.message);
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mediaState.url]);

    useEffect(() => {
      if (mediaState.error) {
        if (mediaState.error.startsWith('no offline file'))
          showMessage(sharedStr.fileNotFound);
        else showMessage(mediaState.error);
        setState((state: ICtxState) => {
          return {
            ...state,
            loading: false,
            audioBlob: undefined,
            playing: false,
          };
        });
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mediaState.error]);

    if (view.current !== '') {
      const target = view.current;
      view.current = '';
      return <StickyRedirect to={target} />;
    }

    return (
      <PassageDetailContext.Provider
        value={{
          state: {
            ...state,
            hasUrl: mediaState.status === MediaSt.FETCHED,
            mediaUrl: mediaState.url,
            setSelected,
            setPlaying,
            setPDBusy,
            refresh,
          },
          setState,
        }}
      >
        {props.children}
      </PassageDetailContext.Provider>
    );
  })
);

export { PassageDetailContext, PassageDetailProvider };
