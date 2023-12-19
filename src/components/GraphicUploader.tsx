import { shallowEqual, useSelector } from 'react-redux';
import { restoreScroll } from '../utils';
import MediaUpload, { SIZELIMIT, UploadType } from './MediaUpload';
import { mediaTabSelector } from '../selector';
import { GraphicD, IMediaTabStrings } from '../model';
import imageCompression from 'browser-image-compression';
import { useGlobal } from 'reactn';
import { logError, Severity } from '../utils';

// Converting to/from Blob: https://stackoverflow.com/questions/68276368/javascript-convert-a-blob-object-to-a-string-and-back
// https://stackoverflow.com/questions/18650168/convert-blob-to-base64

export const ApmDim = 40;
export const Rights = 'rights';

export interface CompressedImages {
  name: string;
  content: string;
  type: string;
  dimension: number;
}

export interface IGraphicInfo {
  [key: string]: CompressedImages | string | undefined;
}

interface IProps {
  defaultFilename?: string;
  dimension: number[];
  isOpen: boolean;
  onOpen: (visible: boolean) => void;
  showMessage: (msg: string | JSX.Element) => void;
  finish?: (images: CompressedImages[]) => void; // when conversion complete
  cancelled: React.MutableRefObject<boolean>;
  uploadType?: UploadType;
  metadata?: JSX.Element;
}
export const apmGraphic = (graphicRec: GraphicD) => {
  const apmDimStr = `${ApmDim}`;
  const info: IGraphicInfo = JSON.parse(graphicRec.attributes.info);
  if (info.hasOwnProperty(apmDimStr)) {
    return {
      graphicUri: (info[apmDimStr] as CompressedImages).content,
      graphicRights: info[Rights] as string | undefined,
    };
  }
  return undefined;
};
export function GraphicUploader(props: IProps) {
  const {
    defaultFilename,
    dimension,
    isOpen,
    onOpen,
    showMessage,
    cancelled,
    uploadType,
    finish,
    metadata,
  } = props;
  const t: IMediaTabStrings = useSelector(mediaTabSelector, shallowEqual);
  const [errorReporter] = useGlobal('errorReporter');

  function blobToBase64(blob: Blob) {
    return new Promise((resolve, _) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  }

  const fileReport = (imageFile: File | Blob, desc?: string) => {
    // console.log(`${desc} instance of Blob`, imageFile instanceof Blob);
    const value = imageFile.size / 1024 / 1024;
    console.log(
      `${desc} size ` +
        (value > 1
          ? `${value.toFixed(2)} MB`
          : `${(value * 1024).toFixed(2)} KB`)
    );
  };

  const sizedName = (name: string, size: number, ext: string | undefined) => {
    return ext && name.endsWith(ext)
      ? name.replace(`.${ext}`, `-${size}.${ext}`)
      : `${name}-${size}.${ext}`;
  };

  const uploadMedia = async (files: File[]) => {
    if (!files || files.length === 0) {
      showMessage(t.selectFiles);
      return;
    }
    const results: CompressedImages[] = [];
    const imageFile = files[0];
    fileReport(imageFile, 'Original');

    for (let dim of dimension) {
      const options = {
        maxSizeMb: SIZELIMIT,
        maxWidthOrHeight: dim,
        useWebWorker: true,
      };
      try {
        const compressedFile = await imageCompression(imageFile, options);
        fileReport(compressedFile, `Compressed ${dim}`);
        const ext = imageFile.name.split('.').pop();
        results.push({
          name: sizedName(defaultFilename || imageFile.name, dim, ext),
          content: (await blobToBase64(compressedFile)) as string,
          type: imageFile.type,
          dimension: dim,
        });
      } catch (error) {
        logError(Severity.error, errorReporter, error as Error);
      }
    }
    if (finish) finish(results);
  };

  const uploadCancel = () => {
    onOpen(false);
    if (cancelled) cancelled.current = true;
    restoreScroll();
  };

  return (
    <MediaUpload
      visible={isOpen}
      onVisible={onOpen}
      uploadType={uploadType || UploadType.Media}
      uploadMethod={uploadMedia}
      cancelMethod={uploadCancel}
      metaData={metadata}
    />
  );
}
