import React, { useState, useEffect, useRef } from 'react';
// see: https://upmostly.com/tutorials/how-to-use-the-usecontext-hook-in-react
import { useGlobal } from 'reactn';
import { useParams } from 'react-router-dom';
import { connect } from 'react-redux';
import {
  IState,
  Plan,
  MediaFile,
  Resource,
  ISharedStrings,
  Passage,
  Section,
  BookName,
  OrgWorkflowStep,
  ArtifactCategory,
} from '../model';
import localStrings from '../selector/localize';
import { withData } from '../mods/react-orbitjs';
import { QueryBuilder } from '@orbit/data';
import {
  remoteId,
  useFetchMediaUrl,
  MediaSt,
  remoteIdGuid,
  related,
  getAllMediaRecs,
} from '../crud';
import StickyRedirect from '../components/StickyRedirect';
import { loadBlob, logError, Severity } from '../utils';
import Auth from '../auth/Auth';
import { useSnackBar } from '../hoc/SnackBar';
import * as actions from '../store';
import { bindActionCreators } from 'redux';
import JSONAPISource from '@orbit/jsonapi';

export const getPlanName = (plan: Plan) => {
  return plan.attributes ? plan.attributes.name : '';
};

interface IStateProps {
  sharedStr: ISharedStrings;
  allBookData: BookName[];
  booksLoaded: boolean;
  lang: string;
}
const mapStateToProps = (state: IState): IStateProps => ({
  sharedStr: localStrings(state, { layout: 'shared' }),
  allBookData: state.books.bookData,
  booksLoaded: state.books.loaded,
  lang: state.strings.lang,
});

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

interface IRecordProps {
  passages: Passage[];
  sections: Section[];
  mediafiles: MediaFile[];
  categories: ArtifactCategory[];
}

const mapRecordsToProps = {
  passages: (q: QueryBuilder) => q.findRecords('passage'),
  sections: (q: QueryBuilder) => q.findRecords('section'),
  mediafiles: (q: QueryBuilder) => q.findRecords('mediafile'),
  categories: (q: QueryBuilder) => q.findRecords('artifactcategory'),
};

export interface IRowData {
  // planName: string;
  // planType: string;
  mediafile: MediaFile;
  playItem: string;
  artifactName: string;
  artifactType: string;
  artifactCategory: string;
}

const initState = {
  passage: {} as Passage,
  section: {} as Section,
  currentstep: '',
  orgWorkflowSteps: [] as OrgWorkflowStep[],
  setOrgWorkflowSteps: (steps: OrgWorkflowStep[]) => {},
  setCurrentStep: (step: string) => {},
  index: 0, //row index?
  selected: '',
  setSelected: (selected: string) => {},
  playing: false,
  setPlaying: (playing: boolean) => {},
  rowData: Array<IRowData>(),
  playItem: '',
  refresh: () => {},
  sharedStr: {} as ISharedStrings,
  mediafileId: '',
  loading: false,
  hasUrl: false,
  mediaUrl: '',
  audioBlob: undefined as Blob | undefined,
  pdBusy: false,
  setPDBusy: (pdBusy: boolean) => {},
  allBookData: Array<BookName>(),
  getSharedResources: async () => [] as Resource[],
};

export type ICtxState = typeof initState;

interface IContext {
  state: ICtxState;
  setState: React.Dispatch<React.SetStateAction<ICtxState>>;
}

const PassageDetailContext = React.createContext({} as IContext);

interface IProps extends IStateProps, IDispatchProps, IRecordProps {
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
    mapStateToProps,
    mapDispatchToProps
  )((props: IProps) => {
    const [reporter] = useGlobal('errorReporter');
    const { passages, sections, mediafiles, categories } = props;
    const { sharedStr } = props;
    const { lang, allBookData, fetchBooks, booksLoaded } = props;
    const { prjId, pasId, mediaId } = useParams<ParamTypes>();
    const [memory] = useGlobal('memory');
    const [coordinator] = useGlobal('coordinator');
    const remote = coordinator.getSource('remote') as JSONAPISource;
    const [user] = useGlobal('user');
    const [project] = useGlobal('project');
    const [devPlan] = useGlobal('plan');
    const [projRole] = useGlobal('projRole');
    const [errorReporter] = useGlobal('errorReporter');
    const view = React.useRef('');
    const [refreshed, setRefreshed] = useState(0);
    const mediaUrlRef = useRef('');
    const { showMessage } = useSnackBar();
    const [trackedTask, setTrackedTask] = useGlobal('trackedTask');
    const [state, setState] = useState({
      ...initState,
      allBookData,
    });
    const { fetchMediaUrl, mediaState } = useFetchMediaUrl(reporter);
    const fetching = useRef('');

    const setOrgWorkflowSteps = (steps: OrgWorkflowStep[]) => {
      setState((state: ICtxState) => {
        return { ...state, orgWorkflowSteps: steps };
      });
    };
    const setCurrentStep = (stepId: string) => {
      console.log('setting currentstep', stepId);
      setState((state: ICtxState) => {
        return { ...state, currentstep: stepId, playing: false };
      });
    };

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
    const getSharedResources = async () => {
      if (remote)
        return (await remote.query((q: QueryBuilder) =>
          q.findRecords('resource')
        )) as Resource[];
      else return [] as Resource[];
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
      var p = passages.find(
        (p) => p.id === remoteIdGuid('passage', pasId, memory.keyMap)
      );
      if (p) {
        var s = sections.find((s) => s.id === related(p, 'section'));
        if (s) {
          setState((state: ICtxState) => {
            return {
              ...state,
              passage: p as Passage,
              section: s as Section,
            };
          });
        }
      }
    }, [memory.keyMap, pasId, passages, sections]);

    useEffect(() => {
      if (!booksLoaded) {
        fetchBooks(lang);
      } else {
        setState((state: ICtxState) => {
          return { ...state, allBookData };
        });
      }
      /* eslint-disable-next-line react-hooks/exhaustive-deps */
    }, [lang, booksLoaded, allBookData]);

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

    useEffect(() => {
      const passageId = remoteIdGuid('passage', pasId, memory.keyMap) || pasId;
      const newData = Array<IRowData>();
      getAllMediaRecs(passageId, memory).forEach((m) => {
        const catRec = categories.find(
          (c) => c.id === related(m, 'artifactCategory')
        );
        newData.push({
          mediafile: m,
          artifactName: m.attributes.originalFile,
          artifactType: m.attributes.artifactType,
          artifactCategory: catRec?.attributes?.categoryname,
        } as IRowData);
      });
      setState((state: ICtxState) => {
        return { ...state, rowData: newData };
      });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pasId]);

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
            setOrgWorkflowSteps,
            setCurrentStep,
            setPlaying,
            setPDBusy,
            getSharedResources,
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
