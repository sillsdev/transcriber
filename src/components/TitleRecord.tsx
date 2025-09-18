import { Stack } from '@mui/material';
import MediaRecord from './MediaRecord';
import { ActionRow, AltButton, PriButton } from './StepEditor';
import { ISharedStrings } from '../model';
import { shallowEqual, useSelector } from 'react-redux';
import { sharedSelector } from '../selector';
import { VernacularTag } from '../crud';
import { useRef, useState, useEffect } from 'react';

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
  const [stackWidth, setStackWidth] = useState<number>(0);
  const stackRef = useRef<HTMLDivElement>(null);
  const ts: ISharedStrings = useSelector(sharedSelector, shallowEqual);

  useEffect(() => {
    const updateWidth = () => {
      if (stackRef.current) {
        // Get the computed style to account for padding
        const computedStyle = window.getComputedStyle(stackRef.current);
        const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;
        const paddingRight = parseFloat(computedStyle.paddingRight) || 0;
        const contentWidth =
          stackRef.current.clientWidth - paddingLeft - paddingRight;
        setStackWidth(contentWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stackRef.current]);

  return (
    <Stack ref={stackRef} direction="column" spacing={2}>
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
        height={200}
        width={stackWidth}
        allowDeltaVoice={true}
        allowNoNoise={false}
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
