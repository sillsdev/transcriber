import { Stack } from '@mui/material';
import MediaRecord from './MediaRecord';
import { ActionRow, AltButton, PriButton } from './StepEditor';
import { ISharedStrings } from '../model';
import { shallowEqual, useSelector } from 'react-redux';
import { sharedSelector } from '../selector';

interface IProps {
  recToolId: string;
  defaultFilename: string;
  autoStart?: boolean;
  uploadSuccess?: boolean;
  canSave: boolean;
  onMyRecording: (recording: boolean) => void;
  handleSetCanSave: (canSave: boolean) => void;
  uploadMedia: (files: File[]) => Promise<void>;
  setStatusText: (status: string) => void;
  onCancel?: () => void;
  onSave?: () => void;
}

export default function TitleRecord(props: IProps) {
  const {
    recToolId,
    defaultFilename,
    uploadSuccess,
    onMyRecording,
    uploadMedia,
    canSave,
    handleSetCanSave,
    setStatusText,
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
        uploadSuccess={uploadSuccess}
        size={200}
        autoStart={false}
      />
      <ActionRow>
        <AltButton onClick={onCancel}>{ts.cancel}</AltButton>
        <PriButton disabled={!canSave} onClick={onSave}>
          {ts.save}
        </PriButton>
      </ActionRow>
    </Stack>
  );
}
