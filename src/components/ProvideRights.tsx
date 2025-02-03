import {
  ICommunityStrings,
  ISharedStrings,
  MediaFileD,
  Organization,
} from '../model';
import {
  Button,
  Paper,
  Typography,
  Box,
  SxProps,
  LinearProgress,
} from '@mui/material';
import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArtifactTypeSlug,
  useArtifactType,
  remoteIdGuid,
  findRecord,
  related,
  useUpdateRecord,
} from '../crud';
import Memory from '@orbit/memory';
import { useSnackBar } from '../hoc/SnackBar';
import { cleanFileName } from '../utils';
import MediaRecord from './MediaRecord';
import { useGlobal } from '../context/GlobalContext';
import { UnsavedContext } from '../context/UnsavedContext';
import Uploader from './Uploader';
import AddIcon from '@mui/icons-material/LibraryAddOutlined';
import { GrowingSpacer, PriButton } from '../control';
import { communitySelector, sharedSelector } from '../selector';
import { shallowEqual, useSelector } from 'react-redux';
import { AddRecord, ReplaceRelatedRecord } from '../model/baseModel';
import IntellectualProperty from '../model/intellectualProperty';
import { UploadType } from './MediaUpload';
import {
  RecordIdentity,
  RecordKeyMap,
  UninitializedRecord,
} from '@orbit/records';
import React from 'react';
import { VoiceStatement } from '../business/voice/VoiceStatement';
import { IVoicePerm } from '../business/voice/PersonalizeVoicePermission';

const paperProps = { p: 2, m: 'auto', width: `calc(100% - 32px)` } as SxProps;
const rowProp = { display: 'flex', p: 2 };
const buttonProp = { mx: 1 } as SxProps;
const statusProps = {
  mr: 2,
  alignSelf: 'center',
  display: 'block',
  gutterBottom: 'true',
} as SxProps;

interface IProps {
  speaker: string;
  recordType: ArtifactTypeSlug;
  onRights?: (hasRights: boolean) => void;
  createProject?: (name: string) => Promise<string>;
  team?: string;
  recordingRequired?: boolean;
}

export function ProvideRights(props: IProps) {
  const {
    speaker,
    recordType,
    onRights,
    createProject,
    team,
    recordingRequired,
  } = props;
  const [user] = useGlobal('user');
  const [organizationId] = useGlobal('organization');
  const [busy] = useGlobal('importexportBusy');
  const [state, setState] = useState<IVoicePerm>({});
  const [statusText, setStatusText] = useState('');
  const [canSave, setCanSave] = useState(false);
  const [defaultFilename, setDefaultFileName] = useState('');
  const [coordinator] = useGlobal('coordinator');
  const memory = coordinator?.getSource('memory') as Memory;
  const [importList, setImportList] = useState<File[]>();
  const [uploadVisible, setUploadVisible] = useState(false);
  const [resetMedia, setResetMedia] = useState(false);
  const [statement, setStatement] = useState<string>('');
  const {
    toolChanged,
    toolsChanged,
    startSave,
    saveCompleted,
    saveRequested,
    clearRequested,
    clearCompleted,
  } = useContext(UnsavedContext).state;

  const { getTypeId } = useArtifactType();
  const { showMessage } = useSnackBar();
  const cancelled = useRef(false);
  const updateRecord = useUpdateRecord();
  const t: ICommunityStrings = useSelector(communitySelector, shallowEqual);
  const ts: ISharedStrings = useSelector(sharedSelector, shallowEqual);

  const toolId = 'RecordArtifactTool';

  const teamRec = React.useMemo(
    () =>
      findRecord(
        memory,
        'organization',
        team || organizationId
      ) as Organization,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [organizationId, team]
  );

  useEffect(() => {
    toolChanged(toolId, canSave);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canSave]);

  const recordTypeId = useMemo(
    () => getTypeId(recordType),
    [recordType, getTypeId]
  );

  const artifactState = useMemo(() => ({ id: recordTypeId }), [recordTypeId]);

  useEffect(() => {
    setDefaultFileName(cleanFileName(`${speaker}_ip`));
    setState({ fullName: speaker } as IVoicePerm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speaker]);

  useEffect(() => {
    if (saveRequested(toolId) && canSave) handleSave();
    else if (clearRequested(toolId)) {
      clearCompleted(toolId);
    }

    return () => {
      if (!saveRequested(toolId)) {
        clearCompleted(toolId);
      }
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toolsChanged, canSave]);

  const handleSave = () => {
    //tell the media recorder to save
    if (!saveRequested(toolId)) {
      startSave(toolId);
    }
  };

  const handleStatement = (statement: string) => {
    if (recordingRequired) setStatement(statement);
  };

  const afterUpload = async (planId: string, mediaRemoteIds?: string[]) => {
    setStatusText('');
    if (mediaRemoteIds && mediaRemoteIds.length > 0) {
      if (!cancelled.current) {
        let orgId = team || organizationId;
        if (!orgId) {
          const planRec = findRecord(memory, 'plan', planId);
          const projRec = findRecord(
            memory,
            'project',
            related(planRec, 'project')
          );
          orgId = related(projRec, 'organization');
        }
        const mediaId =
          remoteIdGuid(
            'mediafile',
            mediaRemoteIds[0],
            memory?.keyMap as RecordKeyMap
          ) ?? mediaRemoteIds[0];
        if (statement) {
          const mediaRec = findRecord(
            memory,
            'mediafile',
            mediaId
          ) as MediaFileD;
          updateRecord({
            ...mediaRec,
            attributes: { ...mediaRec.attributes, transcription: statement },
          } as MediaFileD);
        }
        const ip = {
          type: 'intellectualproperty',
          attributes: {
            rightsHolder: speaker,
            notes: JSON.stringify(state),
          },
        } as IntellectualProperty & UninitializedRecord;
        await memory.update((t) => [
          ...AddRecord(t, ip, user, memory),
          ...ReplaceRelatedRecord(
            t,
            ip as RecordIdentity,
            'releaseMediafile',
            'mediafile',
            mediaId
          ),
          ...ReplaceRelatedRecord(
            t,
            ip as RecordIdentity,
            'organization',
            'organization',
            orgId
          ),
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
        {!recordingRequired && (
          <Box sx={rowProp}>
            <Button
              sx={buttonProp}
              id="spkr-upload"
              onClick={handleUpload}
              title={ts.uploadRights}
            >
              <AddIcon />
              {ts.uploadRights}
            </Button>
          </Box>
        )}
        <VoiceStatement
          voice={speaker}
          team={teamRec}
          state={state}
          setState={setState}
          setStatement={handleStatement}
        />
        <MediaRecord
          toolId={toolId}
          uploadMethod={uploadMedia}
          defaultFilename={defaultFilename}
          allowWave={false}
          showFilename={false}
          allowDeltaVoice={false}
          setCanSave={handleSetCanSave}
          setStatusText={setStatusText}
          doReset={resetMedia}
          setDoReset={setResetMedia}
          size={200}
        />
        <Box sx={rowProp}>
          {!recordingRequired && (
            <Button id="spkr-later" onClick={handleLater}>
              {t.later}
            </Button>
          )}
          <Typography variant="caption" sx={statusProps}>
            {statusText}
          </Typography>
          <GrowingSpacer />
          <PriButton
            id="spkr-save"
            sx={buttonProp}
            onClick={handleSave}
            disabled={!canSave}
          >
            {ts.save}
          </PriButton>
        </Box>
        {busy && (
          <Box sx={{ display: 'flex', flexGrow: 1, alignItems: 'center' }}>
            <Typography>{`${t.loading}\u00A0`}</Typography>
            <LinearProgress
              variant="indeterminate"
              sx={{ display: 'flex', flexGrow: 1 }}
            />
          </Box>
        )}
      </Paper>
      <Uploader
        noBusy={false}
        recordAudio={false}
        importList={importList}
        isOpen={uploadVisible}
        onOpen={handleUploadVisible}
        showMessage={showMessage}
        multiple={false}
        finish={afterUpload}
        cancelled={cancelled}
        artifactState={artifactState}
        performedBy={speaker}
        createProject={createProject}
        uploadType={UploadType.IntellectualProperty}
      />
    </div>
  );
}

export default ProvideRights;
