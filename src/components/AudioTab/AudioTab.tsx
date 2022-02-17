import React, { useState, useEffect, useRef, useContext } from 'react';
import clsx from 'clsx';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import * as actions from '../../store';
import {
  IState,
  MediaFile,
  Passage,
  Section,
  IMediaTabStrings,
  Plan,
  BookName,
  ISharedStrings,
  RoleNames,
} from '../../model';
import localStrings from '../../selector/localize';
import { withData, WithDataProps } from '../../mods/react-orbitjs';
import { QueryBuilder } from '@orbit/data';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import { Button, AppBar } from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
// import FilterIcon from '@material-ui/icons/FilterList';
// import SelectAllIcon from '@material-ui/icons/SelectAll';
import { ActionHeight, tabActions, actionBar } from '../PlanTabs';
import { useSnackBar } from '../../hoc/SnackBar';
import BigDialog from '../../hoc/BigDialog';
import AudioTable from './AudioTable';
import Uploader from '../Uploader';
import Auth from '../../auth/Auth';
import {
  getMediaInPlans,
  usePlan,
  remoteIdGuid,
  VernacularTag,
} from '../../crud';
import { useGlobal } from 'reactn';
import { HeadHeight } from '../../App';
import { useMediaAttach } from '../../crud/useMediaAttach';
import Memory from '@orbit/memory';
import PassageChooser from './PassageChooser';
import Template from './Template';
import {
  getMedia,
  getPassages,
  IAttachMap,
  IGetMedia,
  IPassageData,
  IPRow,
  IRow,
} from '.';
import { IMatchData, makeMatchMap } from './makeRefMap';
import { UnsavedContext } from '../../context/UnsavedContext';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    container: {
      display: 'flex',
    },
    paper: {},
    bar: actionBar,
    highBar: {
      top: `${HeadHeight}px`,
    },
    content: {
      paddingTop: `calc(${ActionHeight}px + ${theme.spacing(2)}px)`,
    },
    progress: {
      width: '100%',
    },
    actions: tabActions,
    grow: {
      flexGrow: 1,
    },
    button: {
      margin: theme.spacing(1),
    },
    icon: {
      marginLeft: theme.spacing(1),
    },
    row: {
      display: 'flex',
      flexDirection: 'row',
    },
    template: {
      marginBottom: theme.spacing(2),
    },
  })
);

interface IStateProps {
  t: IMediaTabStrings;
  ts: ISharedStrings;
  allBookData: BookName[];
}

interface IDispatchProps {
  doOrbitError: typeof actions.doOrbitError;
}

interface IRecordProps {
  mediaFiles: Array<MediaFile>;
  passages: Array<Passage>;
  sections: Array<Section>;
}

interface IProps
  extends IStateProps,
    IDispatchProps,
    IRecordProps,
    WithDataProps {
  auth: Auth;
}

export function AudioTab(props: IProps) {
  const {
    t,
    ts,
    doOrbitError,
    mediaFiles,
    passages,
    sections,
    auth,
    allBookData,
  } = props;
  const classes = useStyles();
  const [projRole] = useGlobal('projRole');
  const [plan] = useGlobal('plan');
  const [coordinator] = useGlobal('coordinator');
  const memory = coordinator.getSource('memory') as Memory;
  const { getPlan } = usePlan();
  const [planRec] = useState(getPlan(plan) || ({} as Plan));
  const [isOffline] = useGlobal('offline');
  const [offlineOnly] = useGlobal('offlineOnly');
  const { toolChanged, saveCompleted } = useContext(UnsavedContext).state;
  const [urlOpen, setUrlOpen] = useGlobal('autoOpenAddMedia');
  const { showMessage } = useSnackBar();
  const [data, setData] = useState(Array<IRow>());
  const [pdata, setPData] = useState(Array<IPRow>());
  const [attachVisible, setAttachVisible] = useState(false);
  const [mcheck, setMCheck] = useState(-1);
  const [pcheck, setPCheck] = useState(-1);
  // const [filter, setFilter] = useState(false);
  const [uploadVisible, setUploadVisible] = useState(false);
  const cancelled = useRef(false);
  const [complete, setComplete] = useGlobal('progress');
  const [autoMatch, setAutoMatch] = useState(false);
  const [playItem, setPlayItem] = useState('');
  const [attachMap, setAttachMap] = useState<IAttachMap>({});
  const [planMedia, setPlanMedia] = useState<MediaFile[]>([]);
  const [uploadMedia, setUploadMedia] = useState<string>();
  const inProcess = React.useRef<boolean>(false);
  const [attachPassage, detachPassage] = useMediaAttach({
    ...props,
    doOrbitError,
  });
  const [refresh, setRefresh] = useState(false);
  const myToolId = 'AudioTab';
  const hasPassage = (pRow: number) => {
    for (let mediaId of Object.keys(attachMap)) {
      if (attachMap[mediaId] === pRow) return true;
    }
    return false;
  };

  const handleUpload = () => {
    cancelled.current = false;
    setUploadVisible(true);
  };

  const handleAutoMatch = () => setAutoMatch(!autoMatch);

  const handleAttachCancel = () => {
    setAttachVisible(false);
    setPCheck(-1);
    setMCheck(-1);
  };

  const handleSave = async (argMap?: IAttachMap) => {
    const map = argMap || attachMap;
    inProcess.current = true;
    showMessage(t.saving);
    const handleRow = async (mediaId: string) => {
      const pRow = map[mediaId];
      await attachPassage(pdata[pRow].id, pdata[pRow].sectionId, plan, mediaId);
    };
    const total = Object.keys(map).length;
    let n = 0;
    setComplete(n);
    for (let mediaId of Object.keys(map)) {
      if (cancelled.current) break;
      await handleRow(mediaId);
      n += 1;
      setComplete(Math.min((n * 100) / total, 100));
    }
    setAttachMap({});
    if (cancelled.current) cancelled.current = false;
    else showMessage(t.savingComplete);
    inProcess.current = false;
    saveCompleted(myToolId);
  };

  const mediaRow = (mediaId: string) => {
    return data.reduce((m, r, j) => {
      return r.id === mediaId ? j : m;
    }, -1);
  };

  const doDetach = (mediaId: string) => {
    const mRow = mediaRow(mediaId);
    if (attachMap.hasOwnProperty(mediaId)) {
      const newMap = { ...attachMap };
      delete newMap[mediaId];
      setAttachMap(newMap);
      toolChanged(myToolId, true);
    } else {
      const passId = data[mRow].passId;
      if (passId && passId !== '') {
        detachPassage(passId, data[mRow].sectionId, plan, mediaId);
      } else {
        showMessage(t.noPassageAttached.replace('{0}', data[mRow].fileName));
      }
    }
  };

  const doAttach = (mRow: number, pRow: number) => {
    if (attachMap.hasOwnProperty(data[mRow].id)) {
      showMessage(t.fileAttached);
      return;
    }
    handleSave({ ...attachMap, [data[mRow].id]: pRow });
    setMCheck(-1);
    setPCheck(-1);
  };

  const handleCheck = (checks: Array<number>, visible?: boolean) => {
    if (visible || attachVisible) {
      const newCheck = checks[0] === mcheck ? checks[1] : checks[0];
      if (checks.length === 1 && pcheck >= 0) {
        doAttach(checks[0], pcheck);
        return;
      }
      setMCheck(newCheck);
    }
  };
  // const handleFilter = () => setFilter(!filter);

  const handleUploadCancel = () => {
    cancelled.current = true;
  };

  useEffect(() => {
    if (urlOpen) {
      setUploadVisible(true);
      setUrlOpen(false);
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [urlOpen]);

  const onAttach = (checks: number[], attach: boolean) => {
    if (attach) {
      setAttachVisible(true);
      handleCheck(checks, true);
    } else doDetach(data[checks[0]].id);
  };

  useEffect(() => {
    if (plan && mediaFiles.length > 0) {
      setPlanMedia(getMediaInPlans([plan], mediaFiles, VernacularTag));
    }
  }, [mediaFiles, plan]);

  // Check if playItem changes
  useEffect(() => {
    if (data[0]?.playIcon !== playItem) {
      const mediaData: IGetMedia = {
        planName: planRec?.attributes?.name,
        passages,
        sections,
        playItem,
        allBookData,
        isPassageDate: true,
      };
      const newData = getMedia(planMedia, mediaData);
      setData(newData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playItem]);

  useEffect(() => {
    const mediaData: IGetMedia = {
      planName: planRec?.attributes?.name,
      passages,
      sections,
      playItem,
      allBookData,
      isPassageDate: true,
    };
    const newData = getMedia(planMedia, mediaData);
    setData(newData);
    setRefresh(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planMedia, passages, sections, refresh]);

  useEffect(() => {
    if (attachVisible || autoMatch) {
      const passData: IPassageData = { media: planMedia, allBookData };
      const newPassData = getPassages(plan, passages, sections, passData);
      setPData(newPassData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planMedia, passages, sections, attachVisible, autoMatch]);

  useEffect(() => {
    if (attachVisible || autoMatch) {
      let dataChange = false;
      const newPData = pdata.map((r, i) => {
        const newRow = hasPassage(i)
          ? { ...r, attached: 'Y', isAttaching: true }
          : null;
        if (newRow) {
          dataChange = true;
          return newRow;
        }
        return { ...r };
      });
      if (dataChange) setPData(newPData);
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [attachMap, attachVisible, autoMatch]);

  const afterUpload = (planId: string, mediaRemoteIds?: string[]) => {
    if (mediaRemoteIds && mediaRemoteIds.length === 1) {
      if (!cancelled.current) {
        setUploadMedia(
          remoteIdGuid('mediafile', mediaRemoteIds[0], memory.keyMap) ||
            mediaRemoteIds[0]
        );
        setAttachVisible(true);
      }
    }
  };

  const matchMap = (pat: string, options: IMatchData) => {
    if (pdata.length === 0 || data.length === 0) return;
    const result = makeMatchMap(pat, options);
    if (result) {
      const { found, newMap } = result;
      if (found) {
        setAttachMap(newMap);
        showMessage(t.matchAdded.replace('{0}', found.toString()));
        handleSave(newMap);
        return;
      }
    }
    showMessage(t.noMatch);
  };

  return (
    <div className={classes.container}>
      <div className={classes.paper}>
        <AppBar
          position="fixed"
          className={clsx(classes.bar, {
            [classes.highBar]: false,
          })}
          color="default"
        >
          <div className={classes.actions}>
            {projRole === RoleNames.Admin && (!isOffline || offlineOnly) && (
              <>
                <Button
                  id="audUpload"
                  key="upload"
                  aria-label={ts.uploadMediaPlural}
                  variant="outlined"
                  color="primary"
                  className={classes.button}
                  onClick={handleUpload}
                >
                  {ts.uploadMediaPlural}
                  <AddIcon className={classes.icon} />
                </Button>
                <Button
                  id="audMatch"
                  key={t.autoMatch}
                  aria-label={t.autoMatch}
                  variant="outlined"
                  color="primary"
                  className={classes.button}
                  onClick={handleAutoMatch}
                >
                  {t.autoMatch}
                </Button>
              </>
            )}
            <div className={classes.grow}>{'\u00A0'}</div>
            {complete !== 0 && complete !== 100 && (
              <Button
                id="uploadCancel"
                aria-label={ts.cancel}
                variant="outlined"
                color="primary"
                className={classes.button}
                onClick={handleUploadCancel}
              >
                {ts.cancel}
              </Button>
            )}
            {/* <Button
              id="audFilt"
              key="filter"
              aria-label={t.filter}
              variant="outlined"
              color="primary"
              className={classes.button}
              onClick={handleFilter}
              title={t.showHideFilter}
            >
              {t.filter}
              {filter ? (
                <SelectAllIcon className={classes.icon} />
              ) : (
                <FilterIcon className={classes.icon} />
              )}
            </Button> */}
          </div>
        </AppBar>
        <div className={classes.content}>
          {autoMatch && (
            <div className={classes.template}>
              <Template
                matchMap={matchMap}
                options={{ data, pdata, attachMap } as IMatchData}
              />
            </div>
          )}
          <div className={classes.row}>
            <AudioTable
              data={data}
              auth={auth}
              setRefresh={setRefresh}
              playItem={playItem}
              setPlayItem={setPlayItem}
              onAttach={onAttach}
            />
            {attachVisible && (
              <BigDialog
                title={t.choosePassage}
                isOpen={attachVisible || false}
                onOpen={setAttachVisible}
                onCancel={handleAttachCancel}
              >
                <PassageChooser
                  data={pdata}
                  row={mcheck}
                  doAttach={doAttach}
                  visible={attachVisible}
                  setVisible={setAttachVisible}
                  uploadMedia={uploadMedia}
                  setUploadMedia={setUploadMedia}
                  mediaRow={mediaRow}
                />
              </BigDialog>
            )}
          </div>
        </div>
      </div>
      <Uploader
        recordAudio={false}
        auth={auth}
        isOpen={uploadVisible}
        onOpen={setUploadVisible}
        showMessage={showMessage}
        multiple={true}
        finish={afterUpload}
        cancelled={cancelled}
      />
    </div>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'mediaTab' }),
  ts: localStrings(state, { layout: 'shared' }),
  allBookData: state.books.bookData,
});

const mapDispatchToProps = (dispatch: any): IDispatchProps => ({
  ...bindActionCreators(
    {
      doOrbitError: actions.doOrbitError,
    },
    dispatch
  ),
});

const mapRecordsToProps = {
  mediaFiles: (q: QueryBuilder) => q.findRecords('mediafile'),
  passages: (q: QueryBuilder) => q.findRecords('passage'),
  sections: (q: QueryBuilder) => q.findRecords('section'),
};

export default withData(mapRecordsToProps)(
  connect(mapStateToProps, mapDispatchToProps)(AudioTab) as any
) as any;
