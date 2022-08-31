import { ICommunityStrings, ISharedStrings, MediaFile } from '../model';
import { Button, Paper, Typography, Box, SxProps } from '@mui/material';
import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ArtifactTypeSlug, useArtifactType, remoteIdGuid } from '../crud';
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
const rowProp = { display: 'flex', p: 2 };
const buttonProp = { mx: 1 } as SxProps;
const statusProps = {
  mr: 2,
  alignSelf: 'center',
  display: 'block',
  gutterBottom: 'true',
} as SxProps;

interface IRecordProps {
  mediafiles: Array<MediaFile>;
}
interface IProps {
  speaker: string;
  recordType: ArtifactTypeSlug;
  onRights?: (hasRights: boolean) => void;
}

export function ProvideRights(props: IProps & IRecordProps) {
  const { speaker, recordType, onRights } = props;
  const [offlineOnly] = useGlobal('offlineOnly');
  const [user] = useGlobal('user');
  const [orgId] = useGlobal('organization');
  const [statusText, setStatusText] = useState('');
  const [canSave, setCanSave] = useState(false);
  const [defaultFilename, setDefaultFileName] = useState('');
  const [coordinator] = useGlobal('coordinator');
  const memory = coordinator.getSource('memory') as Memory;
  const [importList, setImportList] = useState<File[]>();
  const [uploadVisible, setUploadVisible] = useState(false);
  const [resetMedia, setResetMedia] = useState(false);
  const { toolChanged, toolsChanged, startSave, saveCompleted, saveRequested } =
    useContext(UnsavedContext).state;

  const { getTypeId } = useArtifactType();
  const { showMessage } = useSnackBar();
  const cancelled = useRef(false);
  const t: ICommunityStrings = useSelector(communitySelector, shallowEqual);
  const ts: ISharedStrings = useSelector(sharedSelector, shallowEqual);

  const toolId = 'RecordArtifactTool';

  useEffect(() => {
    toolChanged(toolId, canSave);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canSave]);

  const recordTypeId = useMemo(
    () => getTypeId(recordType),
    [recordType, getTypeId]
  );

  useEffect(() => {
    setDefaultFileName(cleanFileName(`${speaker}_ip`));
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
          ...ReplaceRelatedRecord(
            t,
            ip,
            'releaseMediafile',
            'mediafile',
            mediaId
          ),
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

  const handleLater = () => {
    onRights && onRights(true);
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
        />
        <Box sx={rowProp}>
          <Button onClick={handleLater}>{t.later}</Button>
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
        artifactTypeId={recordTypeId}
        performedBy={speaker}
        uploadType={UploadType.IntellectualProperty}
      />
    </div>
  );
}

const mapRecordsToProps = {
  mediafiles: (q: QueryBuilder) => q.findRecords('mediafile'),
};
export default withData(mapRecordsToProps)(ProvideRights) as any as (
  props: IProps
) => JSX.Element;
