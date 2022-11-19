import { shallowEqual, useSelector } from 'react-redux';
import { ISharedStrings, MediaFile } from '../../model';
import { Button, Typography, SxProps, Box } from '@mui/material';
import { useContext, useEffect, useRef, useState } from 'react';
import { findRecord, useFetchMediaUrl, VernacularTag } from '../../crud';
import { useGlobal } from 'reactn';
import usePassageDetailContext from '../../context/usePassageDetailContext';
import { passageDefaultFilename } from '../../utils/passageDefaultFilename';
import Memory from '@orbit/memory';
import { useSnackBar } from '../../hoc/SnackBar';
import { withData } from 'react-orbitjs';
import { QueryBuilder, RecordIdentity } from '@orbit/data';
import MediaRecord from '../MediaRecord';
import { UnsavedContext } from '../../context/UnsavedContext';
import Uploader from '../Uploader';
import AudacityManager from '../Workflow/AudacityManager';
import { isElectron } from '../../api-variable';
import { AudacityLogo, PriButton } from '../../control';
import AddIcon from '@mui/icons-material/LibraryAddOutlined';
import BigDialog from '../../hoc/BigDialog';
import VersionDlg from '../AudioTab/VersionDlg';
import VersionsIcon from '@mui/icons-material/List';
import { PlanProvider } from '../../context/PlanContext';
import SpeakerName from '../SpeakerName';
import { sharedSelector } from '../../selector';

const buttonProps = {
  mx: 1,
  maxHeight: '40px',
  alignSelf: 'center',
} as SxProps;

interface IRecordProps {
  mediafiles: Array<MediaFile>;
}
interface IProps {
  ready?: () => boolean;
}

const SaveWait = 500;

export function PassageDetailRecord(props: IProps & IRecordProps) {
  const { ready, mediafiles } = props;
  const ts: ISharedStrings = useSelector(sharedSelector, shallowEqual);
  const { startSave, toolChanged, toolsChanged, saveRequested, waitForSave } =
    useContext(UnsavedContext).state;
  const [reporter] = useGlobal('errorReporter');
  const [offlineOnly] = useGlobal('offlineOnly');
  const { fetchMediaUrl, mediaState } = useFetchMediaUrl(reporter);
  const [statusText, setStatusText] = useState('');
  const [canSave, setCanSave] = useState(false);
  const [defaultFilename, setDefaultFileName] = useState('');
  const [coordinator] = useGlobal('coordinator');
  const memory = coordinator.getSource('memory') as Memory;
  const { passage, mediafileId } = usePassageDetailContext();
  const { showMessage } = useSnackBar();
  const toolId = 'RecordTool';
  const onReady = () => {};
  const [importList, setImportList] = useState<File[]>();
  const cancelled = useRef(false);
  const [uploadVisible, setUploadVisible] = useState(false);
  const [audacityVisible, setAudacityVisible] = useState(false);
  const [versionVisible, setVersionVisible] = useState(false);
  const [preload, setPreload] = useState(false);
  const [resetMedia, setResetMedia] = useState(false);
  const [speaker, setSpeaker] = useState('');
  const [hasRights, setHasRight] = useState(false);

  useEffect(() => {
    toolChanged(toolId, canSave);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canSave]);

  useEffect(() => {
    if (saveRequested(toolId)) handleSave();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toolsChanged]);

  useEffect(() => {
    if (!mediafileId) {
      fetchMediaUrl({ id: mediafileId });
      setResetMedia(true);
    } else if (mediafileId !== mediaState.id) {
      fetchMediaUrl({ id: mediafileId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediafileId, passage]);

  useEffect(() => {
    setDefaultFileName(
      passageDefaultFilename(passage?.id, memory, VernacularTag)
    );
  }, [memory, passage, mediafiles]);

  useEffect(() => {
    const mediaRec = findRecord(memory, 'mediafile', mediafileId) as
      | MediaFile
      | undefined;
    const performer = mediaRec?.attributes?.performedBy;
    if (performer) {
      setSpeaker(performer);
      setHasRight(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediafileId, mediafiles]);

  const handleSave = () => {
    startSave(toolId);
  };

  const afterUpload = async (planId: string, mediaRemoteIds?: string[]) => {
    setStatusText('');
    if (importList) {
      setImportList(undefined);
      setUploadVisible(false);
      setAudacityVisible(false);
    }
    setPreload(true);
  };

  const saveIfChanged = (cb: () => void) => {
    if (canSave) {
      startSave(toolId);
      waitForSave(() => cb(), SaveWait);
    } else cb();
  };

  //from the on screen recorder...send it off to the uploader
  const uploadMedia = async (files: File[]) => {
    setImportList(files);
    setUploadVisible(true);
  };
  const handleAudacityImport = (i: number, list: File[]) => {
    saveIfChanged(() => {
      setImportList(list);
      setUploadVisible(true);
    });
  };

  const handleAudacityClose = () => {
    setAudacityVisible(false);
  };
  const handleUploadVisible = (v: boolean) => {
    setUploadVisible(v);
  };
  const handleUpload = () => {
    saveIfChanged(() => {
      setUploadVisible(true);
    });
  };
  const handleAudacity = () => {
    saveIfChanged(() => {
      setAudacityVisible(true);
    });
  };
  const handleVersions = () => {
    setVersionVisible(true);
  };
  const handleVerHistClose = () => {
    setVersionVisible(false);
  };
  const handleNameChange = (name: string) => setSpeaker(name);
  const handleRights = (hasRights: boolean) => setHasRight(hasRights);

  return (
    <PlanProvider {...props}>
      <div>
        <Button
          sx={buttonProps}
          id="pdRecordVersions"
          onClick={handleVersions}
          title={ts.versionHistory}
        >
          <VersionsIcon />
          {ts.versionHistory}
        </Button>
        <Button
          sx={buttonProps}
          id="pdRecordUpload"
          onClick={handleUpload}
          title={!offlineOnly ? ts.uploadMediaSingular : ts.importMediaSingular}
        >
          <AddIcon />
          {!offlineOnly ? ts.uploadMediaSingular : ts.importMediaSingular}
        </Button>

        {isElectron && (
          <Button
            sx={buttonProps}
            id="pdAudacity"
            onClick={handleAudacity}
            title={ts.launchAudacity}
          >
            <AudacityLogo />
            {ts.launchAudacity}
          </Button>
        )}
        <Box sx={{ py: 1 }}>
          <SpeakerName
            name={speaker}
            onChange={handleNameChange}
            onRights={handleRights}
          />
        </Box>
        <MediaRecord
          toolId={toolId}
          mediaId={mediafileId}
          uploadMethod={uploadMedia}
          onReady={onReady}
          defaultFilename={defaultFilename}
          allowRecord={hasRights}
          allowWave={true}
          showFilename={true}
          preload={preload}
          setCanSave={setCanSave}
          setStatusText={setStatusText}
          doReset={resetMedia}
          setDoReset={setResetMedia}
          metaData={
            <>
              <Typography
                variant="caption"
                sx={{
                  mr: 2,
                  alignSelf: 'center',
                  display: 'block',
                  gutterBottom: 'true',
                }}
              >
                {statusText}
              </Typography>
              <PriButton
                id="rec-save"
                onClick={handleSave}
                disabled={(ready && !ready()) || !canSave || !hasRights}
              >
                {ts.save}
              </PriButton>
            </>
          }
        />

        <Uploader
          recordAudio={false}
          importList={importList}
          isOpen={uploadVisible}
          onOpen={handleUploadVisible}
          showMessage={showMessage}
          multiple={false}
          finish={afterUpload}
          cancelled={cancelled}
          passageId={passage.id}
          performedBy={speaker}
          onSpeakerChange={handleNameChange}
        />
        <AudacityManager
          item={1}
          open={audacityVisible}
          onClose={handleAudacityClose}
          passageId={{ type: 'passage', id: passage.id } as RecordIdentity}
          mediaId={mediafileId}
          onImport={handleAudacityImport}
          speaker={speaker}
          onSpeaker={handleNameChange}
        />
        <BigDialog
          title={ts.versionHistory}
          isOpen={versionVisible}
          onOpen={handleVerHistClose}
        >
          <VersionDlg passId={passage.id} />
        </BigDialog>
      </div>
    </PlanProvider>
  );
}

const mapRecordsToProps = {
  mediafiles: (q: QueryBuilder) => q.findRecords('mediafile'),
};

export default withData(mapRecordsToProps)(PassageDetailRecord) as any as (
  props: IProps
) => JSX.Element;
