import { shallowEqual, useSelector } from 'react-redux';
import { IMediaUploadStrings } from '../model';
import { mediaUploadSelector } from '../selector';
import { API_CONFIG } from '../api-variable';
import BigDialog, { BigDialogBp } from '../hoc/BigDialog';
import MediaUploadContent from './MediaUploadContent';
import { FaithBridge } from '../assets/brands';

export const UriLinkType = 'text/uri-list';
export const MarkDownType = 'text/markdown';
export const Mp3Type = 'audio/mpeg';
export const FaithbridgeType = 'audio/mpeg/s3link';

export enum UploadType {
  Media = 0,
  Resource = 1,
  ITF = 2,
  PTF = 3,
  LOGO = 4 /* do we need separate ones for org and avatar? */,
  ProjectResource = 5,
  IntellectualProperty = 6,
  Graphic = 7,
  Link = 8,
  MarkDown = 9,
  FaithbridgeLink = 10,
}
const PROJECTRESOURCE_SIZELIMIT = 50;
const NO_SIZELIMIT = 10000;

export const SIZELIMIT = (uploadType: UploadType) => {
  switch (uploadType) {
    case UploadType.ProjectResource:
      return PROJECTRESOURCE_SIZELIMIT;
    case UploadType.ITF:
    case UploadType.PTF:
    case UploadType.FaithbridgeLink:
      return NO_SIZELIMIT;
    default:
      return parseInt(API_CONFIG.sizeLimit);
  }
};
interface IProps {
  visible: boolean;
  onVisible: (v: boolean) => void;
  uploadType: UploadType;
  uploadMethod?: (files: File[]) => void;
  multiple?: boolean;
  cancelMethod?: () => void;
  cancelLabel?: string;
  metaData?: JSX.Element;
  ready?: () => boolean;
  speaker?: string;
  onSpeaker?: (speaker: string) => void;
  team?: string; // used to check for speakers when adding a card
  onFiles?: (files: File[]) => void;
  inValue?: string;
  onValue?: (value: string) => void;
  onNonAudio?: (nonAudio: boolean) => void;
}

function MediaUpload(props: IProps) {
  const {
    visible,
    onVisible,
    uploadType,
    multiple,
    uploadMethod,
    cancelMethod,
    cancelLabel,
    metaData,
    ready,
    speaker,
    onSpeaker,
    team,
    onFiles,
    inValue,
    onValue,
    onNonAudio,
  } = props;
  const t: IMediaUploadStrings = useSelector(mediaUploadSelector, shallowEqual);
  const title = [
    t.title,
    t.resourceTitle,
    t.ITFtitle,
    t.PTFtitle,
    'FUTURE TODO',
    t.resourceTitle,
    t.intellectualPropertyTitle,
    t.graphicTitle,
    t.linkTitle,
    t.markdownTitle,
    t.faithbridgeTitle.replace('{0}', FaithBridge),
  ];
  const handleCancel = () => {
    if (cancelMethod) {
      cancelMethod();
    }
    onVisible(false);
  };

  return (
    <BigDialog
      isOpen={visible}
      onOpen={handleCancel}
      title={title[uploadType]}
      bp={BigDialogBp.sm}
    >
      <MediaUploadContent
        onVisible={onVisible}
        uploadType={uploadType}
        multiple={multiple}
        uploadMethod={uploadMethod}
        cancelMethod={cancelMethod}
        cancelLabel={cancelLabel}
        metaData={metaData}
        ready={ready}
        speaker={speaker}
        onSpeaker={onSpeaker}
        team={team}
        onFiles={onFiles}
        inValue={inValue}
        onValue={onValue}
        onNonAudio={onNonAudio}
      />
    </BigDialog>
  );
}

export default MediaUpload;
