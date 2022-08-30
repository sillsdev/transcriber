import { connect } from 'react-redux';
import { ICommunityStrings, ISharedStrings, IState, MediaFile } from '../model';
import { Button, Paper, Typography, Box, SxProps } from '@mui/material';
import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArtifactTypeSlug,
  findRecord,
  useArtifactType,
  useFetchMediaUrl,
  remoteIdGuid,
} from '../crud';
import usePassageDetailContext from '../context/usePassageDetailContext';
import * as actions from '../store';
import { bindActionCreators } from 'redux';
import Memory from '@orbit/memory';
import { useSnackBar } from '../hoc/SnackBar';
import { withData } from '../mods/react-orbitjs';
import { QueryBuilder } from '@orbit/data';
import { cleanFileName } from '../utils';
import MediaRecord from './MediaRecord';
import { useGlobal } from 'reactn';
import { UnsavedContext } from '../context/UnsavedContext';
import Uploader from './Uploader';
import AddIcon from '@mui/icons-material/LibraryAddOutlined';
import { GrowingSpacer, PriButton } from '../control';
import { communitySelector, sharedSelector } from '../selector';
import { shallowEqual, useSelector } from 'react-redux';
import { AddRecord, ReplaceRelatedRecord } from '../model/baseModel';
import IntellectualProperty from '../model/intellectualProperty';
import { UploadType } from './MediaUpload';

const paperProps = { p: 2, m: 'auto', width: `calc(100% - 32px)` } as SxProps;
const rowProp = { display: 'flex' };
const buttonProp = { mx: 1 } as SxProps;
const statusProps = {
  mr: 2,
  alignSelf: 'center',
  display: 'block',
  gutterBottom: 'true',
} as SxProps;

interface IDispatchProps {
  uploadFiles: typeof actions.uploadFiles;
  nextUpload: typeof actions.nextUpload;
  uploadComplete: typeof actions.uploadComplete;
  doOrbitError: typeof actions.doOrbitError;
}
interface IRecordProps {
  mediafiles: Array<MediaFile>;
}
interface IProps {
  speaker: string;
  recordType: ArtifactTypeSlug;
  onRights?: (hasRights: boolean) => void;
}

export function ProvideRights(props: IProps & IRecordProps & IDispatchProps) {
  const { speaker, recordType, onRights } = props;
  const [reporter] = useGlobal('errorReporter');
  const [offlineOnly] = useGlobal('offlineOnly');
  const [user] = useGlobal('user');
  const [orgId] = useGlobal('organization');
  const { fetchMediaUrl, mediaState } = useFetchMediaUrl(reporter);
  const [statusText, setStatusText] = useState('');
  const [canSave, setCanSave] = useState(false);
  const [defaultFilename, setDefaultFileName] = useState('');
  const [coordinator] = useGlobal('coordinator');
  const memory = coordinator.getSource('memory') as Memory;
  const [importList, setImportList] = useState<File[]>();
  const [uploadVisible, setUploadVisible] = useState(false);
  const [resetMedia, setResetMedia] = useState(false);
  const {
    passage,
    mediafileId,
    setPlaying,
    setCommentPlaying,
    setItemPlaying,
  } = usePassageDetailContext();
  const { toolChanged, toolsChanged, startSave, saveCompleted, saveRequested } =
    useContext(UnsavedContext).state;

  const { getTypeId } = useArtifactType();
  const { showMessage } = useSnackBar();
  const [currentVersion, setCurrentVersion] = useState(1);
  const cancelled = useRef(false);
  const t: ICommunityStrings = useSelector(communitySelector, shallowEqual);
  const ts: ISharedStrings = useSelector(sharedSelector, shallowEqual);

  const toolId = 'RecordArtifactTool';

  useEffect(() => {
    toolChanged(toolId, canSave);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canSave]);

  useEffect(() => {
    if (mediafileId !== mediaState.id) fetchMediaUrl({ id: mediafileId });
    var mediaRec = findRecord(memory, 'mediafile', mediafileId) as MediaFile;
    setCurrentVersion(mediaRec?.attributes?.versionNumber || 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediafileId]);

  const recordTypeId = useMemo(
    () => getTypeId(recordType),
    [recordType, getTypeId]
  );

  useEffect(() => {
    setDefaultFileName(cleanFileName(`${speaker}_v${currentVersion}`));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speaker]);

  useEffect(() => {
    if (saveRequested(toolId) && canSave) handleSave();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toolsChanged, canSave]);

  const handleSave = () => {
    //tell the media recorder to save
    if (!saveRequested(toolId)) {
      startSave(toolId);
    }
  };

  const afterUpload = async (planId: string, mediaRemoteIds?: string[]) => {
    setStatusText('');
    if (mediaRemoteIds && mediaRemoteIds.length > 0) {
      if (!cancelled.current) {
        const mediaId = remoteIdGuid(
          'mediafile',
          mediaRemoteIds[0],
          memory.keyMap
        );
        const ip = {
          type: 'intellectualproperty',
          attributes: {
            rightsHolder: speaker,
          },
        } as IntellectualProperty;
        await memory.update((t) => [
          ...AddRecord(t, ip, user, memory),
          ...ReplaceRelatedRecord(t, ip, 'releaseMedia', 'mediafile', mediaId),
          ...ReplaceRelatedRecord(t, ip, 'organization', 'organization', orgId),
        ]);
        onRights && onRights(true);
      }
    }
    saveCompleted(toolId);
    if (importList) {
      setImportList(undefined);
      setUploadVisible(false);
      setResetMedia(true);
    }
  };

  const handleUploadVisible = (v: boolean) => {
    setUploadVisible(v);
  };
  const handleUpload = () => {
    if (canSave) {
      showMessage(t.saveFirst);
      return;
    }
    setImportList(undefined);
    setUploadVisible(true);
  };
  //from recorder...send it on to uploader
  const uploadMedia = async (files: File[]) => {
    setImportList(files);
    setUploadVisible(true);
  };

  const handleSetCanSave = (valid: boolean) => {
    if (valid !== canSave) {
      setCanSave(valid);
    }
  };
  const onRecordingOrPlaying = (doingsomething: boolean) => {
    if (doingsomething) {
      setPlaying(false); //stop the vernacular
      setItemPlaying(false);
      setCommentPlaying(false);
    }
  };

  return (
    <div>
      <Paper sx={paperProps}>
        <Box sx={rowProp}>
          <Button
            sx={buttonProp}
            id="pdRecordUpload"
            onClick={handleUpload}
            title={
              !offlineOnly ? ts.uploadMediaSingular : ts.importMediaSingular
            }
          >
            <AddIcon />
            {!offlineOnly ? ts.uploadMediaSingular : ts.importMediaSingular}
          </Button>
        </Box>
        <Box sx={rowProp}>
          <Typography sx={statusProps}>{t.record}</Typography>
        </Box>
        <MediaRecord
          id="mediarecord"
          toolId={toolId}
          uploadMethod={uploadMedia}
          defaultFilename={defaultFilename}
          allowWave={false}
          showFilename={false}
          setCanSave={handleSetCanSave}
          setStatusText={setStatusText}
          doReset={resetMedia}
          setDoReset={setResetMedia}
          size={200}
          onRecording={onRecordingOrPlaying}
          onPlayStatus={onRecordingOrPlaying}
        />
        <Box sx={rowProp}>
          <Typography variant="caption" sx={statusProps}>
            {statusText}
          </Typography>
          <GrowingSpacer />
          <PriButton
            id="rec-save"
            sx={buttonProp}
            onClick={handleSave}
            disabled={!canSave}
          >
            {ts.save}
          </PriButton>
        </Box>
      </Paper>
      <Uploader
        noBusy={true}
        recordAudio={false}
        importList={importList}
        isOpen={uploadVisible}
        onOpen={handleUploadVisible}
        showMessage={showMessage}
        multiple={false}
        finish={afterUpload}
        cancelled={cancelled}
        passageId={passage.id}
        sourceMediaId={mediafileId}
        artifactTypeId={recordTypeId}
        performedBy={speaker}
        uploadType={UploadType.IntellectualProperty}
      />
    </div>
  );
}

const mapStateToProps = (state: IState) => ({});
const mapDispatchToProps = (dispatch: any): IDispatchProps => ({
  ...bindActionCreators(
    {
      uploadFiles: actions.uploadFiles,
      nextUpload: actions.nextUpload,
      uploadComplete: actions.uploadComplete,
      doOrbitError: actions.doOrbitError,
    },
    dispatch
  ),
});
const mapRecordsToProps = {
  mediafiles: (q: QueryBuilder) => q.findRecords('mediafile'),
};
export default withData(mapRecordsToProps)(
  connect(mapStateToProps, mapDispatchToProps)(ProvideRights) as any
) as any as (props: IProps) => JSX.Element;
