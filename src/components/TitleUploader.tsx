import { shallowEqual, useSelector } from 'react-redux';
import { restoreScroll } from '../utils';
import MediaUpload, { UploadType } from './MediaUpload';
import { mediaTabSelector, sharedSelector } from '../selector';
import { IMediaTabStrings, ISharedStrings } from '../model';
import { useSnackBar } from '../hoc/SnackBar';
import { IconButton, Stack } from '@mui/material';
import ResetIcon from '@mui/icons-material/SettingsBackupRestore';
import { ActionRow, AltButton, GrowingSpacer, PriButton } from './StepEditor';

interface IProps {
  defaultFilename?: string;
  isOpen: boolean;
  onOpen: (visible: boolean) => void;
  hasRights?: boolean; // required for upload
  finish?: (files: File[]) => void; // when conversion complete
  cancelled: React.MutableRefObject<boolean>;
  uploadType?: UploadType;
  metadata?: JSX.Element;
  onReset?: () => void;
  onCancel?: () => void;
  onSave?: () => void;
}

export function TitleUploader(props: IProps) {
  const {
    isOpen,
    onOpen,
    cancelled,
    uploadType,
    hasRights,
    finish,
    metadata,
    onReset,
    onCancel,
    onSave,
  } = props;
  const { showMessage } = useSnackBar();
  const t: IMediaTabStrings = useSelector(mediaTabSelector, shallowEqual);
  const ts: ISharedStrings = useSelector(sharedSelector, shallowEqual);

  const uploadMedia = async (files: File[]) => {
    if (!files || files.length === 0) {
      showMessage(t.selectFiles);
      return;
    }
    finish?.(files);
  };

  const uploadCancel = () => {
    onOpen(false);
    if (cancelled) cancelled.current = true;
    restoreScroll();
  };

  return (
    <Stack direction="column" spacing={2}>
      <MediaUpload
        visible={isOpen}
        onVisible={onOpen}
        uploadType={uploadType || UploadType.Media}
        ready={() => Boolean(hasRights)}
        uploadMethod={uploadMedia}
        cancelMethod={uploadCancel}
        metaData={metadata}
      />
      <ActionRow>
        <IconButton onClick={onReset}>
          <ResetIcon />
        </IconButton>
      </ActionRow>
      <GrowingSpacer />
      <AltButton onClick={onCancel}>{ts.cancel}</AltButton>
      <PriButton onClick={onSave}>{ts.save}</PriButton>
    </Stack>
  );
}
