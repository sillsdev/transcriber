import React, { useState, useEffect } from 'react';
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
} from '../../model';
import localStrings from '../../selector/localize';
import { withData, WithDataProps } from '../../mods/react-orbitjs';
import { QueryBuilder } from '@orbit/data';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import { Button, AppBar } from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import FilterIcon from '@material-ui/icons/FilterList';
import SelectAllIcon from '@material-ui/icons/SelectAll';
import { ActionHeight, tabActions, actionBar } from '../PlanTabs';
import { useSnackBar } from '../../hoc/SnackBar';
import BigDialog from '../../hoc/BigDialog';
import AudioTable from './AudioTable';
import Uploader, { statusInit } from '../Uploader';
import Template from '../../control/template';
import Auth from '../../auth/Auth';
import { getMediaInPlans, usePlan, remoteIdGuid } from '../../crud';
import { useGlobal } from 'reactn';
import { localeDefault, useRemoteSave } from '../../utils';
import { HeadHeight } from '../../App';
import { useMediaAttach } from '../../crud/useMediaAttach';
import Memory from '@orbit/memory';
import VersionDlg from './VersionDlg';
import PassageChooser from './PassageChooser';
import { IRow, IPRow, getMedia, IGetMedia, getPassages, IPassageData } from '.';

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
    actions: theme.mixins.gutters(tabActions) as any,
    grow: {
      flexGrow: 1,
    },
    button: {
      margin: theme.spacing(1),
    },
    icon: {
      marginLeft: theme.spacing(1),
    },
    link: {},
    unsupported: {
      color: theme.palette.secondary.light,
    },
    row: {
      display: 'flex',
      flexDirection: 'row',
    },
    template: {
      marginBottom: theme.spacing(2),
    },
    slider: {
      marginLeft: theme.spacing(2),
      width: '80%',
    },
    cell: {
      width: '100%',
      padding: theme.spacing(1),
    },
  })
);

// key is mediaId and value is row in pdata (passage data) table
interface IAttachMap {
  [key: string]: number;
}

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
  const [, setChanged] = useGlobal('changed');
  const [, saveCompleted] = useRemoteSave();
  const [urlOpen, setUrlOpen] = useGlobal('autoOpenAddMedia');
  const [isDeveloper] = useGlobal('developer');
  const { showMessage } = useSnackBar();
  const [data, setData] = useState(Array<IRow>());
  const [pdata, setPData] = useState(Array<IPRow>());
  const [attachCount, setAttachCount] = useState(0);
  const [attachVisible, setAttachVisible] = useState(false);
  const [mcheck, setMCheck] = useState(-1);
  const [pcheck, setPCheck] = useState(-1);
  const [verHist, setVerHist] = useState('');
  const [filter, setFilter] = useState(false);
  const [uploadVisible, setUploadVisible] = useState(false);
  const [status] = useState(statusInit);
  const [, setComplete] = useGlobal('progress');
  const [autoMatch, setAutoMatch] = useState(false);
  const [playItem, setPlayItem] = useState('');
  const [attachMap, setAttachMap] = useState<IAttachMap>({});
  const [dataAttach, setDataAttach] = useState(new Set<number>());
  const [uploadMedia, setUploadMedia] = useState<string>();
  const inProcess = React.useRef<boolean>(false);
  const [attachPassage, detachPassage] = useMediaAttach({
    ...props,
    ts,
    doOrbitError,
  });
  const [refresh, setRefresh] = useState(false);

  const hasPassage = (pRow: number) => {
    for (let mediaId of Object.keys(attachMap)) {
      if (attachMap[mediaId] === pRow) return true;
    }
    return false;
  };

  const handleVerHist = () => {
    setVerHist('');
  };

  const handleUpload = () => {
    setUploadVisible(true);
  };

  const handleAutoMatch = () => setAutoMatch(!autoMatch);

  const handleAttachCancel = () => {
    setAttachVisible(false);
    setPCheck(-1);
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
      await handleRow(mediaId);
      n += 1;
      setComplete(Math.min((n * 100) / total, 100));
    }
    setAttachMap({});
    showMessage(t.savingComplete);
    inProcess.current = false;
    saveCompleted('');
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
      setChanged(true);
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
    if (attachMap.hasOwnProperty(data[mRow].id) || dataAttach.has(mRow)) {
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
  const handleFilter = () => setFilter(!filter);

  useEffect(() => {
    if (urlOpen) {
      setUploadVisible(true);
      setUrlOpen(false);
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [urlOpen]);

  const locale = localeDefault(isDeveloper);

  const onAttach = (checks: number[], attach: boolean) => {
    if (attach) {
      setAttachVisible(true);
      handleCheck(checks, true);
    } else doDetach(data[checks[0]].id);
  };

  useEffect(() => {
    const playChange = data[0]?.playIcon !== playItem;
    const media: MediaFile[] = getMediaInPlans([planRec.id], mediaFiles);

    const mediaData: IGetMedia = {
      planName: planRec?.attributes?.name,
      passages,
      sections,
      playItem,
      allBookData,
      locale,
      isPassageDate: true,
    };
    const newData = getMedia(media, mediaData);
    const medAttach = new Set<number>();
    newData.forEach((r, i) => {
      if (r.sectionDesc !== '') medAttach.add(i);
    });
    if (
      medAttach.size !== dataAttach.size ||
      newData.length !== data.length ||
      playChange ||
      refresh
    ) {
      setDataAttach(medAttach);
      setData(newData);
      setRefresh(false);
    }
    const passData: IPassageData = { media, allBookData };
    const newPassData = getPassages(plan, passages, sections, passData);
    if (pdata.length !== newPassData.length || medAttach.size !== attachCount) {
      setPData(newPassData);
      setAttachCount(medAttach.size);
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [mediaFiles, passages, sections, playItem, allBookData, attachMap, pdata]);

  useEffect(() => {
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
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [attachMap]);

  const afterUpload = (planId: string, mediaRemoteIds?: string[]) => {
    if (mediaRemoteIds && mediaRemoteIds.length === 1) {
      setUploadMedia(
        remoteIdGuid('mediafile', mediaRemoteIds[0], memory.keyMap) ||
          mediaRemoteIds[0]
      );
      setAttachVisible(true);
    }
  };

  const matchMap = (pat: string, terms?: string[]) => {
    if (pdata.length === 0 || data.length === 0) return;
    const rpat = new RegExp(pat);
    const newMap = { ...attachMap };
    const usedPass = new Set<number>();
    Object.keys(newMap).forEach((k) => usedPass.add(newMap[k]));
    let found = 0;
    data.forEach((dr, dn) => {
      if (dr.reference === '') {
        const m = rpat.exec(dr.fileName);
        if (m) {
          for (let i = 0; i < pdata.length; i++) {
            if (usedPass.has(i)) continue;
            const r = pdata[i];
            let fail = false;
            if (terms) {
              for (let j = 0; j < terms.length; j++) {
                const t = terms[j];
                const val = m[j + 1];
                if (t === 'SECT') {
                  if (parseInt(val) !== r.secNum) fail = true;
                } else if (t === 'PASS') {
                  if (parseInt(val) !== r.pasNum) fail = true;
                } else if (t === 'BOOK') {
                  if (val !== r.book) fail = true;
                } else if (t === 'CHAP') {
                  if (parseInt(val) !== r.chap) fail = true;
                } else if (t === 'BEG') {
                  if (parseInt(val) !== r.beg) fail = true;
                } else if (t === 'END') {
                  if (parseInt(val) !== r.end) fail = true;
                }
                if (fail) break;
              }
            }
            if (!fail) {
              newMap[dr.id] = i;
              usedPass.add(i);
              found += 1;
              break;
            }
          }
        }
      }
    });
    if (found) {
      setAttachMap(newMap);
      showMessage(t.matchAdded.replace('{0}', found.toString()));
      handleSave(newMap);
    } else {
      showMessage(t.noMatch);
    }
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
            {projRole === 'admin' && (!isOffline || offlineOnly) && (
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
            <Button
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
            </Button>
          </div>
        </AppBar>
        <div className={classes.content}>
          {autoMatch && (
            <div className={classes.template}>
              <Template matchMap={matchMap} />
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
          </div>
        </div>
      </div>
      <Uploader
        recordAudio={false}
        auth={auth}
        isOpen={uploadVisible}
        onOpen={setUploadVisible}
        showMessage={showMessage}
        setComplete={setComplete}
        multiple={true}
        finish={afterUpload}
        status={status}
      />
      <BigDialog
        title={t.versionHistory}
        isOpen={Boolean(verHist)}
        onOpen={handleVerHist}
      >
        <VersionDlg auth={auth} passId={verHist} />
      </BigDialog>
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
