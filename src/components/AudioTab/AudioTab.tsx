import React, { useState, useEffect, useRef, useContext } from 'react';
import { shallowEqual } from 'react-redux';
import {
  IState,
  MediaFile,
  Passage,
  Section,
  IMediaTabStrings,
  Plan,
  ISharedStrings,
} from '../../model';
import { withData } from 'react-orbitjs';
import { QueryBuilder } from '@orbit/data';
import JSONAPISource from '@orbit/jsonapi';
import { Box } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import {
  AltButton,
  GrowingSpacer,
  PaddedBox,
  TabActions,
  TabAppBar,
} from '../../control';
import { useSnackBar } from '../../hoc/SnackBar';
import BigDialog from '../../hoc/BigDialog';
import AudioTable from './AudioTable';
import Uploader from '../Uploader';
import {
  getMediaInPlans,
  usePlan,
  remoteIdGuid,
  VernacularTag,
  useRole,
} from '../../crud';
import { useGlobal } from '../../mods/reactn';
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
import { useSelector } from 'react-redux';
import { mediaTabSelector, sharedSelector } from '../../selector';

interface IRecordProps {
  mediaFiles: Array<MediaFile>;
  passages: Array<Passage>;
  sections: Array<Section>;
}

interface IProps {}

export function AudioTab(props: IProps & IRecordProps) {
  const { mediaFiles, passages, sections } = props;
  const t: IMediaTabStrings = useSelector(mediaTabSelector, shallowEqual);
  const ts: ISharedStrings = useSelector(sharedSelector, shallowEqual);
  const allBookData = useSelector((state: IState) => state.books.bookData);
  const [plan] = useGlobal('plan');
  const [coordinator] = useGlobal('coordinator');
  const memory = coordinator.getSource('memory') as Memory;
  const remote = coordinator.getSource('remote') as JSONAPISource;
  const requests = React.useRef(0);
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
  const [speaker, setSpeaker] = useState('');
  const [attachPassage, detachPassage] = useMediaAttach({
    ...props,
  });
  const [refresh, setRefresh] = useState(0);
  const { userIsAdmin } = useRole();
  const cloudSync = useRef(false);

  const myToolId = 'AudioTab';

  const handleRefresh = () => setRefresh(refresh + 1);

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

  const handleNameChange = (name: string) => {
    setSpeaker(name);
  };

  const handleAutoMatch = () => setAutoMatch(!autoMatch);

  const handleAttachCancel = () => {
    setUploadMedia(undefined);
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
    if (cancelled.current) {
      cancelled.current = false;
      showMessage(
        t.cancelling
          .replace('{0}', n.toString())
          .replace('{1}', total.toString())
      );
    } else showMessage(t.savingComplete);
    inProcess.current = false;
    saveCompleted(myToolId);
    setTimeout(() => showMessage(t.cloudSync), 1500);
    requests.current = remote?.requestQueue.length;
    cloudSync.current = Boolean(requests.current);
    const progressMessage = () => {
      setTimeout(() => {
        setComplete(
          Math.round(
            ((requests.current - remote.requestQueue.length) * 100) /
              requests.current
          )
        );
        cloudSync.current = remote.requestQueue.length !== 0;
        if (cloudSync.current) progressMessage();
      }, 3000);
    };
    if (remote) progressMessage();
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
    if (plan) {
      setPlanMedia(getMediaInPlans([plan], mediaFiles, VernacularTag, true));
    }
  }, [mediaFiles, plan, refresh]);

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
    <Box sx={{ display: 'flex' }}>
      <div>
        <TabAppBar position="fixed" color="default">
          <TabActions>
            {userIsAdmin && (!isOffline || offlineOnly) && (
              <>
                <AltButton
                  id="audUpload"
                  key="upload"
                  aria-label={ts.uploadMediaPlural}
                  onClick={handleUpload}
                >
                  {ts.uploadMediaPlural}
                  <AddIcon sx={{ ml: 1 }} />
                </AltButton>
                <AltButton
                  id="audMatch"
                  key={t.autoMatch}
                  aria-label={t.autoMatch}
                  onClick={handleAutoMatch}
                >
                  {t.autoMatch}
                </AltButton>
              </>
            )}
            <GrowingSpacer />
            {complete !== 0 && complete !== 100 && !cloudSync.current && (
              <AltButton
                id="uploadCancel"
                aria-label={ts.cancel}
                onClick={handleUploadCancel}
              >
                {ts.cancel}
              </AltButton>
            )}
          </TabActions>
        </TabAppBar>
        <PaddedBox>
          {autoMatch && (
            <Box sx={{ mb: 2 }}>
              <Template
                matchMap={matchMap}
                options={{ data, pdata, attachMap } as IMatchData}
              />
            </Box>
          )}
          <Box sx={{ display: 'flex', flexDirection: 'row' }}>
            <AudioTable
              data={data}
              setRefresh={handleRefresh}
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
          </Box>
        </PaddedBox>
      </div>
      <Uploader
        recordAudio={false}
        isOpen={uploadVisible}
        onOpen={setUploadVisible}
        showMessage={showMessage}
        multiple={true}
        finish={afterUpload}
        cancelled={cancelled}
        performedBy={speaker}
        onSpeakerChange={handleNameChange}
      />
    </Box>
  );
}

const mapRecordsToProps = {
  mediaFiles: (q: QueryBuilder) => q.findRecords('mediafile'),
  passages: (q: QueryBuilder) => q.findRecords('passage'),
  sections: (q: QueryBuilder) => q.findRecords('section'),
};

export default withData(mapRecordsToProps)(AudioTab) as any as (
  props: IProps
) => JSX.Element;
