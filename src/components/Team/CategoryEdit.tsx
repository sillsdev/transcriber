import {
  ArtifactCategoryType,
  IArtifactCategory,
  findRecord,
  remoteIdNum,
  useArtifactCategory,
  useGraphicCreate,
  useGraphicUpdate,
} from '../../crud';
import { useEffect, useRef, useState } from 'react';
import GraphicsIcon from '@mui/icons-material/Image';
import MediaTitle from '../../control/MediaTitle';
import Colorful, { ColorfulProps } from '@uiw/react-color-colorful';
import { useSelector, shallowEqual } from 'react-redux';
import {
  ApmDim,
  CompressedImages,
  GraphicUploader,
  IGraphicInfo,
  Rights,
  apmGraphic,
} from '../GraphicUploader';
import GraphicRights from '../GraphicRights';
import { useGlobal } from 'reactn';
import { useOrbitData } from '../../hoc/useOrbitData';
import { GraphicD, ICategoryStrings } from '../../model';
import { UploadType } from '../MediaUpload';
import { useSnackBar } from '../../hoc/SnackBar';
import { Avatar, Button, IconButton, styled } from '@mui/material';
import { ColorResult } from '@uiw/color-convert';
import { RecordKeyMap } from '@orbit/records';
import { categorySelector } from '../../selector';

const StyledColorful = styled(Colorful)<ColorfulProps>(() => ({
  '& .w-color-alpha': {
    display: 'none',
  },
  '& .w-color-alpha.w-color-hue': {
    display: 'block',
  },
}));

interface IProps {
  category: IArtifactCategory;
  type: ArtifactCategoryType;
  label?: string;
  helper?: string;
  mediaplan: string;
  teamId?: string;
  onChanged(category: IArtifactCategory): void;
  onDeleted(category: IArtifactCategory): void;
  onRecording(recording: boolean): void;
  disabled: boolean;
}
const RowDiv = styled('div')(() => ({
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'left',
}));

export default function CategoryEdit({
  category,
  type,
  label,
  mediaplan,
  teamId,
  helper,
  onChanged,
  onRecording,
  onDeleted,
  disabled,
}: IProps) {
  const { isDuplicateCategory, localizedArtifactCategory, defaultMediaName } =
    useArtifactCategory(category.org);
  const graphicCreate = useGraphicCreate();
  const graphicUpdate = useGraphicUpdate();
  const [memory] = useGlobal('memory');
  const [mediafile, setMediafile] = useState('');
  const [titleValue, setTitleValue] = useState('');
  const [helperText, setHelperText] = useState(helper ?? '');
  const [graphicRights, setGraphicRights] = useState('');
  const [graphicUri, setGraphicUri] = useState('');
  const graphics = useOrbitData<GraphicD[]>('graphic');
  const [uploadGraphicVisible, setUploadGraphicVisible] = useState(false);
  const cancelled = useRef(false);
  const { showMessage } = useSnackBar();
  const [color, setColor] = useState('');
  const [showColor, setShowColor] = useState(false);
  const [resourceId, setResourceId] = useState(0);
  const [graphicRec, setGraphicRec] = useState<GraphicD>();
  const resourceType = 'category';
  const defaultColor = '#ed071d';
  const t: ICategoryStrings = useSelector(categorySelector, shallowEqual);

  const handleTitleChange = (value: string) => {
    value = value.replace(/\|/g, '').trim(); // remove pipe character
    setTitleValue(value);
    category.category = value;
    onChanged(category);
    isDuplicateCategory(value, type, category.id).then((result) => {
      setHelperText(result ? t.duplicate : helper ?? '');
    });
    return '';
  };
  const pointer = { cursor: 'pointer' };
  const handleMediaChange = (value: string) => {
    setMediafile(value);
    category.titleMediaId = value;
    onChanged(category);
  };
  const handleUploadGraphicVisible = (v: boolean) => {
    setUploadGraphicVisible(v);
  };

  const handleRightsChange = (value: string) => {
    setGraphicRights(value);
  };

  useEffect(() => {
    var remoteId = remoteIdNum(
      'artifactcategory',
      category.id,
      memory.keyMap as RecordKeyMap
    );
    setColor(category.color === '' ? defaultColor : category?.color);
    setMediafile(category.titleMediaId ?? '');
    if (!isNaN(remoteId)) {
      setResourceId(remoteId);
      const rec = graphics.find(
        (g) =>
          g.attributes.resourceType === resourceType &&
          g.attributes.resourceId === remoteId
      ) as GraphicD;
      if (graphicRec?.id !== rec?.id) setGraphicRec(rec);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, graphics]);

  useEffect(() => {
    if (graphicRec) {
      var gr = apmGraphic(graphicRec);
      setGraphicRights(gr?.graphicRights ?? '');
      setGraphicUri(gr?.graphicUri ?? '');
    }
  }, [graphicRec]);

  const afterConvert = async (images: CompressedImages[]) => {
    const infoData: IGraphicInfo = { [Rights]: graphicRights };
    images.forEach((image) => {
      infoData[image.dimension.toString()] = image;
    });
    const info = JSON.stringify(infoData);
    if (graphicRec) {
      var upd = {
        ...graphicRec,
        attributes: { ...graphicRec.attributes, info },
      };
      await graphicUpdate(upd);
      setGraphicRec(upd);
    } else {
      var id = await graphicCreate({
        resourceType,
        resourceId,
        info,
      });
      setGraphicRec(findRecord(memory, 'graphic', id) as GraphicD);
    }
  };
  const handleColor = (color: ColorResult) => {
    category.color = color.hex;
    setColor(color.hex);
    onChanged(category);
  };
  const handleUpload = () => {
    cancelled.current = false;
    setUploadGraphicVisible(true);
  };

  return (
    <RowDiv>
      <MediaTitle
        titlekey={category.id ?? 'newcat'}
        label={label ?? ''}
        mediaId={mediafile}
        title={localizedArtifactCategory(category.category)}
        onTextChange={handleTitleChange}
        defaultFilename={defaultMediaName(titleValue)}
        onRecording={
          type === ArtifactCategoryType.Note ? onRecording : undefined
        }
        useplan={mediaplan}
        onMediaIdChange={(mediaId: string) => handleMediaChange(mediaId)}
        disabled={disabled}
        helper={helperText}
      />
      {type === ArtifactCategoryType.Note && (
        <>
          <Button
            sx={{
              width: showColor ? '60px' : '30px',
              height: '30px',
              minWidth: '30px',
              minHeight: '30px',
              borderRadius: showColor ? '' : '50%',
              margin: '5px',
            }}
            style={{ backgroundColor: color }}
            variant="contained"
            onClick={() => setShowColor(!showColor)}
          >
            {showColor ? t.close : ''}
          </Button>
          {showColor && (
            <StyledColorful
              id="colorful"
              color={color}
              onChange={(color) => {
                handleColor(color);
              }}
            />
          )}
          {category.id !== 'newcat' &&
            (graphicUri !== '' ? (
              <Avatar
                sx={pointer}
                src={graphicUri}
                variant="rounded"
                onClick={handleUpload}
              />
            ) : (
              <IconButton sx={pointer} onClick={handleUpload}>
                <GraphicsIcon />
              </IconButton>
            ))}

          <GraphicUploader
            dimension={[1024, 512, ApmDim]}
            defaultFilename={defaultMediaName(titleValue)}
            isOpen={uploadGraphicVisible}
            onOpen={handleUploadGraphicVisible}
            showMessage={showMessage}
            hasRights={Boolean(graphicRights)}
            finish={afterConvert}
            cancelled={cancelled}
            uploadType={UploadType.Graphic}
            metadata={
              <GraphicRights
                value={''}
                teamId={teamId}
                onChange={handleRightsChange}
              />
            }
          />
        </>
      )}
    </RowDiv>
  );
}
