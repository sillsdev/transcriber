import { IconButton, Stack } from '@mui/material';
import ResetIcon from '@mui/icons-material/SettingsBackupRestore';
import MediaRecord from './MediaRecord';
import { ActionRow, AltButton, GrowingSpacer, PriButton } from './StepEditor';
import { ISharedStrings } from '../model';
import { shallowEqual, useSelector } from 'react-redux';
import { sharedSelector } from '../selector';

interface IProps {
  recToolId: string;
  defaultFilename: string;
  autoStart?: boolean;
  onMyRecording: (recording: boolean) => void;
  handleSetCanSave: (canSave: boolean) => void;
  uploadMedia: (files: File[]) => Promise<void>;
  setStatusText: (status: string) => void;
  onReset?: () => void;
  onCancel?: () => void;
  onSave?: () => void;
}

export default function TitleRecord(props: IProps) {
  const {
    recToolId,
    defaultFilename,
    onMyRecording,
    uploadMedia,
    handleSetCanSave,
    setStatusText,
    onReset,
    onCancel,
    onSave,
  } = props;
  const ts: ISharedStrings = useSelector(sharedSelector, shallowEqual);

  return (
    <Stack direction="column" spacing={2}>
      <MediaRecord
        toolId={recToolId}
        onRecording={onMyRecording}
        uploadMethod={uploadMedia}
        defaultFilename={defaultFilename}
        allowWave={false}
        showFilename={false}
        setCanSave={handleSetCanSave}
        setStatusText={setStatusText}
        size={200}
        autoStart={true}
      />
      <ActionRow>
        <IconButton onClick={onReset}>
          <ResetIcon />
        </IconButton>
        <GrowingSpacer />
        <AltButton onClick={onCancel}>{ts.cancel}</AltButton>
        <PriButton onClick={onSave}>{ts.save}</PriButton>
      </ActionRow>
    </Stack>
  );
}
