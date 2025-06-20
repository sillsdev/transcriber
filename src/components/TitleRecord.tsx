import { Stack } from '@mui/material';
import MediaRecord from './MediaRecord';
import { ActionRow, AltButton, PriButton } from './StepEditor';
import { ISharedStrings } from '../model';
import { shallowEqual, useSelector } from 'react-redux';
import { sharedSelector } from '../selector';
import { VernacularTag } from '../crud';

interface IProps {
  recToolId: string;
  titleId: string;
  passageId: string | undefined;
  planId: string | undefined;
  defaultFilename: string;
  autoStart?: boolean;
  canSave: boolean;
  onMyRecording: (recording: boolean) => void;
  handleSetCanSave: (canSave: boolean) => void;
  afterUploadCb: (mediaId: string | undefined) => Promise<void>;
  setStatusText: (status: string) => void;
  onCancel?: () => void;
  onSave?: () => void;
}

export default function TitleRecord(props: IProps) {
  const {
    recToolId,
    titleId,
    passageId,
    planId,
    defaultFilename,
    onMyRecording,
    afterUploadCb,
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
        passageId={passageId}
        planId={planId}
        artifactId={passageId !== undefined ? VernacularTag : titleId}
        onRecording={onMyRecording}
        defaultFilename={defaultFilename}
        allowWave={false}
        showFilename={false}
        setCanSave={handleSetCanSave}
        setStatusText={setStatusText}
        afterUploadCb={afterUploadCb}
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
