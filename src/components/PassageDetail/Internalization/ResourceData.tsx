import {
  Box,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { shallowEqual, useSelector } from 'react-redux';
import { ArtifactCategoryType, useOrganizedBy } from '../../../crud';
import {
  IPassageDetailArtifactsStrings,
  ISharedStrings,
  MediaFileD,
} from '../../../model';
import {
  passageDetailArtifactsSelector,
  sharedSelector,
} from '../../../selector';
import SelectArtifactCategory, {
  ScriptureEnum,
} from '../../Sheet/SelectArtifactCategory';
import { ResourceTypeEnum } from './PassageDetailArtifacts';
import { MarkDownType, UploadType, UriLinkType } from '../../MediaUpload';
import { LinkEdit } from '../../../control/LinkEdit';
import { MarkDownEdit } from '../../../control/MarkDownEdit';
import { mediaContentType } from '../../../utils/contentType';
import { MarkDownView } from '../../../control/MarkDownView';

interface IProps {
  media?: MediaFileD;
  uploadType?: UploadType;
  initCategory: string;
  initDescription: string;
  initPassRes: boolean;
  onCategoryChange: (artifactCategoryId: string) => void;
  onDescriptionChange: (desc: string) => void;
  onPassResChange?: (value: ResourceTypeEnum) => void;
  onTextChange?: (text: string) => void;
  allowProject: boolean;
  catRequired: boolean;
  catAllowNew?: boolean;
  sectDesc?: string;
  passDesc?: string;
}
export function ResourceData(props: IProps) {
  const {
    initCategory,
    initDescription,
    initPassRes,
    onCategoryChange,
    onDescriptionChange,
    onPassResChange,
    catRequired,
    catAllowNew,
    allowProject,
    sectDesc,
    passDesc,
    media,
    uploadType,
    onTextChange,
  } = props;
  const [description, setDescription] = useState(initDescription);
  const { getOrganizedBy } = useOrganizedBy();
  const [value, setValue] = useState(initPassRes ? 'passage' : 'section');
  const [text, setText] = useState(media?.attributes?.originalFile ?? '');
  const t: IPassageDetailArtifactsStrings = useSelector(
    passageDetailArtifactsSelector,
    shallowEqual
  );
  const ts: ISharedStrings = useSelector(sharedSelector, shallowEqual);

  useEffect(() => setDescription(initDescription), [initDescription]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    var newValue = (event.target as HTMLInputElement).value;
    setValue(newValue);
    onPassResChange &&
      onPassResChange(
        newValue === 'section'
          ? ResourceTypeEnum.sectionResource
          : newValue === 'passage'
          ? ResourceTypeEnum.passageResource
          : ResourceTypeEnum.projectResource
      );
  };
  const handleChangeDescription = (e: any) => {
    e.persist();
    setDescription(e.target.value);
    onDescriptionChange(e.target.value);
  };

  const handleTextChange = (newText: string) => {
    setText(newText);
    onTextChange && onTextChange(newText);
  };

  return (
    <Stack spacing={2}>
      {mediaContentType(media) === UriLinkType && (
        <LinkEdit inValue={text} onValue={handleTextChange} />
      )}
      {mediaContentType(media) === MarkDownType && (
        <MarkDownEdit inValue={text} onValue={handleTextChange} />
      )}
      <Box sx={{ pt: 1 }}>
        <TextField
          id="filename"
          label={ts.description}
          value={description || ''}
          onChange={handleChangeDescription}
          required={false}
          fullWidth={true}
        />
      </Box>
      <SelectArtifactCategory
        allowNew={catAllowNew}
        initCategory={initCategory || ''}
        onCategoryChange={onCategoryChange}
        required={catRequired}
        scripture={ScriptureEnum.highlight}
        type={ArtifactCategoryType.Resource}
      />
      {onPassResChange && (
        <FormControl>
          <FormLabel id="resourcekind">{t.tip1a}</FormLabel>
          <RadioGroup
            aria-labelledby="resourcekind"
            value={value}
            onChange={handleChange}
            name="radio-buttons-group"
          >
            <FormControlLabel
              value={'section'}
              control={<Radio />}
              label={sectDesc ?? getOrganizedBy(true)}
            />
            <FormControlLabel
              value={'passage'}
              control={<Radio />}
              label={passDesc ?? t.passageResource}
            />
            {allowProject &&
              ![
                UploadType.Link,
                UploadType.MarkDown,
                UploadType.FaithbridgeLink,
              ].includes(uploadType ?? UploadType.Resource) && (
                <FormControlLabel
                  value={'general'}
                  control={<Radio />}
                  label={t.uploadProject.replace(
                    '{0}',
                    getOrganizedBy(false).toLocaleLowerCase()
                  )}
                />
              )}
          </RadioGroup>
        </FormControl>
      )}
      {media &&
        mediaContentType(media).startsWith('audio') &&
        Boolean(media?.attributes.transcription) && (
          <Stack spacing={1}>
            <Typography variant="h6" sx={{ pt: 1 }}>
              {t.transcription}
            </Typography>
            <MarkDownView value={media?.attributes.transcription || ''} />
          </Stack>
        )}
    </Stack>
  );
}
export default ResourceData;
