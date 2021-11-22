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
  SectionResource,
  SectionResourceUser,
  ArtifactType,
  ArtifactCategory,
  WorkflowStep,
  IPassageDetailArtifactsStrings,
  IWorkflowStepsStrings,
} from '../model';
import localStrings from '../selector/localize';
import { withData } from '../mods/react-orbitjs';
import { QueryBuilder } from '@orbit/data';
import {
  useFetchMediaUrl,
  MediaSt,
  remoteIdGuid,
  related,
  getAllMediaRecs,
} from '../crud';
import { useOrgWorkflowSteps } from '../crud/useOrgWorkflowSteps';
import StickyRedirect from '../components/StickyRedirect';
import { loadBlob, logError, Severity, toCamel } from '../utils';
import Auth from '../auth/Auth';
import { useSnackBar } from '../hoc/SnackBar';
import * as actions from '../store';
import { bindActionCreators } from 'redux';
import JSONAPISource from '@orbit/jsonapi';
import MediaPlayer from '../components/MediaPlayer';
import {
  getResources,
  mediaRows,
  resourceRows,
} from '../components/PassageDetail/Internalization';

export const getPlanName = (plan: Plan) => {
  return plan.attributes ? plan.attributes.name : '';
};

interface IStateProps {
  wfStr: IWorkflowStepsStrings;
  artStr: IPassageDetailArtifactsStrings;
  sharedStr: ISharedStrings;
  allBookData: BookName[];
  booksLoaded: boolean;
  lang: string;
}
const mapStateToProps = (state: IState): IStateProps => ({
  wfStr: localStrings(state, { layout: 'workflowSteps' }),
  artStr: localStrings(state, { layout: 'passageDetailArtifacts' }),
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
  sectionResources: SectionResource[];
  userResources: SectionResourceUser[];
  artifactTypes: ArtifactType[];
  categories: ArtifactCategory[];
  workflowSteps: WorkflowStep[];
  orgWorkflowSteps: OrgWorkflowStep[];
}

const mapRecordsToProps = {
  passages: (q: QueryBuilder) => q.findRecords('passage'),
  sections: (q: QueryBuilder) => q.findRecords('section'),
  mediafiles: (q: QueryBuilder) => q.findRecords('mediafile'),
  sectionResources: (q: QueryBuilder) => q.findRecords('sectionresource'),
  userResources: (q: QueryBuilder) => q.findRecords('sectionresourceuser'),
  artifactTypes: (q: QueryBuilder) => q.findRecords('artifacttype'),
  categories: (q: QueryBuilder) => q.findRecords('artifactcategory'),
  workflowSteps: (q: QueryBuilder) => q.findRecords('workflowsteps'),
  orgWorkflowSteps: (q: QueryBuilder) => q.findRecords('orgworkflowsteps'),
};

export interface IRow {
  id: string;
  sequenceNum: number;
  version: number;
  mediafile: MediaFile;
  playItem: string;
  artifactName: string;
  artifactType: string;
  artifactCategory: string;
  done: boolean;
  editAction: JSX.Element | null;
}

interface SimpleWf {
  id: string;
  label: string;
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
  rowData: Array<IRow>(),
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
  workflow: Array<SimpleWf>(),
  wfIndex: -1,
  isResource: (typeSlug: string) => false,
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
    const { auth, passages, sections, sectionResources, mediafiles } = props;
    const { workflowSteps, orgWorkflowSteps } = props;
    const { wfStr, artStr, sharedStr } = props;
    const { lang, allBookData, fetchBooks, booksLoaded } = props;
    const { pasId } = useParams<ParamTypes>();
    const [memory] = useGlobal('memory');
    const [coordinator] = useGlobal('coordinator');
    const remote = coordinator.getSource('remote') as JSONAPISource;
    const [user] = useGlobal('user');
    const [errorReporter] = useGlobal('errorReporter');
    const view = React.useRef('');
    const [, setRefreshed] = useState(0);
    const mediaUrlRef = useRef('');
    const { showMessage } = useSnackBar();
    const [, setTrackedTask] = useGlobal('trackedTask');
    const [state, setState] = useState({
      ...initState,
      allBookData,
    });
    const { fetchMediaUrl, mediaState } = useFetchMediaUrl(reporter);
    const fetching = useRef('');
    const { GetOrgWorkflowSteps } = useOrgWorkflowSteps();

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

    const setPlaying = (playing: boolean) => {
      const playItem = playing ? state.playItem : '';
      const selected = playing ? state.selected : '';
      setState((state: ICtxState) => {
        return { ...state, playing, selected, playItem };
      });
    };

    const handlePlayEnd = () => {
      setPlaying(false);
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
    const setSelected = (selected: string, rowData: IRow[] = state.rowData) => {
      const i = rowData.findIndex((r) => r.mediafile.id === selected);
      if (i < 0) return;
      const r = rowData[i];
      if (state.index !== i || state.selected !== selected) {
        // const remId =
        //   remoteId('mediafile', selected, memory.keyMap) || selected;
        // if (mediaId !== remId) {
        //   view.current = `/work/${prjId}/${pasId}/${remId}`;
        // }
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

    const isResource = (typeSlug: string) => {
      return ['resource', 'sharedresource'].indexOf(typeSlug) !== -1;
    };

    useEffect(() => {
      var p = passages.find(
        (p) => p.id === remoteIdGuid('passage', pasId, memory.keyMap)
      );
      if (p) {
        var s = sections.find((s) => s.id === related(p, 'section'));
        if (s) {
          if (p.id !== state.passage.id || s.id !== state.section.id)
            setState((state: ICtxState) => {
              return {
                ...state,
                passage: p as Passage,
                section: s as Section,
              };
            });
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
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
      const allMedia = getAllMediaRecs(passageId, memory);
      let newData = mediaRows({
        ...props,
        mediafiles: allMedia,
        user,
        t: artStr,
        isResource,
      });
      const passRec = passages.find((p) => p.id === passageId);
      const sectId = related(passRec, 'section');
      let res = getResources(sectionResources, mediafiles, sectId);
      newData = newData.concat(
        resourceRows({ ...props, res, user, t: artStr })
      );
      setState((state: ICtxState) => {
        return { ...state, rowData: newData };
      });
      if (newData.length > 0) setSelected(newData[0].id, newData);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sectionResources, mediafiles, pasId]);

    if (view.current !== '') {
      const target = view.current;
      view.current = '';
      return <StickyRedirect to={target} />;
    }

    useEffect(() => {
      var wf: SimpleWf[] = [];
      GetOrgWorkflowSteps('OBT').then((orgsteps: any[]) => {
        setOrgWorkflowSteps(orgsteps);
        wf = orgsteps.map((s) => {
          return {
            id: s.id,
            label:
              wfStr.getString(toCamel(s.attributes.name)) || s.attributes.name,
          };
        });
        setState((state: ICtxState) => ({ ...state, workflow: wf }));
      });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [workflowSteps, orgWorkflowSteps]);

    useEffect(() => {
      var passagewf = related(state.passage, 'orgWorkflowStep');
      var psgIndex = state.workflow.findIndex((wf) => wf.id === passagewf);
      if (state.wfIndex !== psgIndex) {
        setState((state: ICtxState) => ({ ...state, wfIndex: psgIndex }));
      }
      if (state.currentstep === '' && state.workflow.length > 0) {
        const next = state.workflow[psgIndex + 1].id;
        if (state.currentstep !== next) {
          setCurrentStep(next);
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.workflow, state.passage]);

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
            isResource,
          },
          setState,
        }}
      >
        {props.children}
        {state.rowData[state.index]?.artifactType === 'resource' && (
          <MediaPlayer
            auth={auth}
            srcMediaId={state.playItem}
            onEnded={handlePlayEnd}
          />
        )}
      </PassageDetailContext.Provider>
    );
  })
);

export { PassageDetailContext, PassageDetailProvider };
