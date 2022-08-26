import {
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  TextField,
} from '@mui/material';
import { useState } from 'react';
import { shallowEqual, useSelector } from 'react-redux';
import { useOrganizedBy } from '../../../crud';
import { IPassageDetailArtifactsStrings, ISharedStrings } from '../../../model';
import {
  passageDetailArtifactsSelector,
  sharedSelector,
} from '../../../selector';
import SelectArtifactCategory, {
  ScriptureEnum,
} from '../../Workflow/SelectArtifactCategory';
import { ResourceTypeEnum } from './PassageDetailArtifacts';

interface IProps {
  initCategory: string; //id
  initDescription: string;
  initPassRes: boolean;
  onCategoryChange: (artifactCategoryId: string) => void;
  onDescriptionChange: (desc: string) => void;
  onPassResChange?: (value: ResourceTypeEnum) => void;
  allowProject: boolean;
  catRequired: boolean;
  catAllowNew?: boolean;
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
  } = props;
  const [description, setDescription] = useState(initDescription);
  const { getOrganizedBy } = useOrganizedBy();
  const [value, setValue] = useState(initPassRes ? 'passage' : 'section');
  const t: IPassageDetailArtifactsStrings = useSelector(
    passageDetailArtifactsSelector,
    shallowEqual
  );
  const ts: ISharedStrings = useSelector(sharedSelector, shallowEqual);

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

  return (
    <div>
      <TextField
        sx={{ m: 1 }}
        id="filename"
        label={ts.description}
        value={description || ''}
        onChange={handleChangeDescription}
        required={false}
        fullWidth={true}
      />
      <SelectArtifactCategory
        allowNew={catAllowNew}
        initCategory={initCategory || ''}
        onCategoryChange={onCategoryChange}
        required={catRequired}
        scripture={ScriptureEnum.highlight}
        resource={true}
      />
      {onPassResChange && (
        <div>
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
                label={getOrganizedBy(true)}
              />
              <FormControlLabel
                value={'passage'}
                control={<Radio />}
                label={t.passageResource}
              />
              {allowProject && (
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
        </div>
      )}
    </div>
  );
}
export default ResourceData;
