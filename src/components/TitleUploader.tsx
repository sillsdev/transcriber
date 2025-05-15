import { shallowEqual, useSelector } from 'react-redux';
import { ISharedStrings } from '../model';
import { restoreScroll } from '../utils';
import { UploadType } from './MediaUpload';
import MediaUploadContent from './MediaUploadContent';
import { sharedSelector } from '../selector';

interface IProps {
  defaultFilename?: string;
  isOpen: boolean;
  onOpen: (visible: boolean) => void;
  hasRights?: boolean; // required for upload
  finish?: (files: File[]) => void; // when conversion complete
  cancelled: React.MutableRefObject<boolean>;
  uploadType?: UploadType;
  uploadMethod: (files: File[]) => Promise<void>;
  metadata?: JSX.Element;
  onSave?: () => void;
}

export function TitleUploader(props: IProps) {
  const {
    isOpen,
    onOpen,
    cancelled,
    uploadType,
    hasRights,
    uploadMethod,
    metadata,
  } = props;
  const ts: ISharedStrings = useSelector(sharedSelector, shallowEqual);

  const uploadCancel = () => {
    onOpen(false);
    if (cancelled) cancelled.current = true;
    restoreScroll();
  };

  return isOpen ? (
    <MediaUploadContent
      onVisible={onOpen}
      uploadType={uploadType || UploadType.Media}
      ready={() => Boolean(hasRights)}
      uploadMethod={uploadMethod}
      cancelMethod={uploadCancel}
      metaData={metadata}
      saveText={ts.save}
    />
  ) : (
    <></>
  );
}
