import { Box, BoxProps, styled, SxProps, TextField } from '@mui/material';
import { useEffect, useState } from 'react';
import {
  IArtifactCategory,
  useArtifactCategory,
} from '../../crud/useArtifactCategory';
import { ArtifactCategory, ISelectArtifactCategoryStrings } from '../../model';
import AddIcon from '@mui/icons-material/Add';
import InfoIcon from '@mui/icons-material/Info';
import { shallowEqual, useSelector } from 'react-redux';
import { QueryBuilder } from '@orbit/data';
import { withData } from 'react-orbitjs';
import { LightTooltip, StyledMenuItem } from '../../control';
import { artifactCategorySelector } from '../../selector';
import { NewArtifactCategory } from './NewArtifactCategory';

interface IRecordProps {
  artifactCategories: Array<ArtifactCategory>;
}
export enum ScriptureEnum {
  hide,
  highlight,
}
interface IProps extends IRecordProps {
  initCategory: string; //id
  onCategoryChange: (artifactCategoryId: string) => void;
  required: boolean;
  allowNew?: boolean;
  scripture?: ScriptureEnum;
  resource?: boolean;
  discussion?: boolean;
  disabled?: boolean;
}

const StyledBox = styled(Box)<BoxProps>(() => ({
  '& .MuiFormControl-root': {
    margin: 0,
  },
  display: 'flex',
  flexDirection: 'column',
}));

const textFieldProps = {
  mr: 1,
  width: 'inherit',
  maxWidth: '400px',
  minWidth: '200px',
} as SxProps;
const menuProps = { width: 300 } as SxProps;
const smallTextProps = { fontSize: 'small' } as SxProps;

export const SelectArtifactCategory = (props: IProps) => {
  const {
    onCategoryChange,
    allowNew,
    required,
    artifactCategories,
    initCategory,
    scripture,
    resource,
    discussion,
    disabled,
  } = props;
  const [categoryId, setCategoryId] = useState(initCategory);
  const [showNew, setShowNew] = useState(false);
  const t: ISelectArtifactCategoryStrings = useSelector(
    artifactCategorySelector,
    shallowEqual
  );
  const { getArtifactCategorys, scriptureTypeCategory } = useArtifactCategory();
  const [artifactCategorys, setArtifactCategorys] = useState<
    IArtifactCategory[]
  >([]);

  useEffect(() => {
    setCategoryId(initCategory);
  }, [initCategory]);

  const getCategorys = async () => {
    var cats = await getArtifactCategorys(
      resource || false,
      discussion || false
    );
    if (scripture === ScriptureEnum.hide)
      cats = cats.filter((c) => !scriptureTypeCategory(c.slug));

    return cats;
  };

  useEffect(() => {
    getCategorys().then((cats) => setArtifactCategorys(cats));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artifactCategories]);

  const categoryAdded = (newId: string) => {
    getCategorys().then((cats) => {
      setArtifactCategorys(cats);
      setCategoryId(newId);
      onCategoryChange(newId);
    });
    cancelNewCategory();
  };
  const cancelNewCategory = () => {
    setShowNew(false);
  };

  const handleArtifactCategoryChange = (e: any) => {
    if (e.target.value === t.addNewCategory) setShowNew(true);
    else {
      setCategoryId(e.target.value);
      onCategoryChange(e.target.value);
    }
  };

  return (
    <StyledBox>
      <TextField
        id="artifact-category"
        select
        label={t.artifactCategory}
        sx={textFieldProps}
        value={categoryId || ''}
        onChange={handleArtifactCategoryChange}
        disabled={disabled}
        SelectProps={{
          MenuProps: {
            sx: menuProps,
          },
        }}
        InputProps={{
          sx: smallTextProps,
        }}
        InputLabelProps={{
          sx: smallTextProps,
        }}
        margin="normal"
        variant="filled"
        required={required}
      >
        {artifactCategorys
          .sort((i, j) => (i.category < j.category ? -1 : 1))
          .map((option: IArtifactCategory) => (
            <StyledMenuItem key={option.id} value={option.id}>
              {option.category + '\u00A0\u00A0'}
              {scripture === ScriptureEnum.highlight ? (
                scriptureTypeCategory(option.slug) ? (
                  <LightTooltip title={t.scriptureHighlight}>
                    <InfoIcon />
                  </LightTooltip>
                ) : (
                  <></>
                )
              ) : (
                <></>
              )}
            </StyledMenuItem>
          ))
          .concat(
            // if not populated yet
            initCategory !== '' &&
              artifactCategorys.findIndex(
                (v: IArtifactCategory) => v.id === initCategory
              ) === -1 ? (
              <StyledMenuItem key={initCategory} value={initCategory}>
                <></>
              </StyledMenuItem>
            ) : allowNew ? (
              <StyledMenuItem key={t.addNewCategory} value={t.addNewCategory}>
                {t.addNewCategory + '\u00A0\u00A0'}
                <AddIcon />
              </StyledMenuItem>
            ) : (
              <div key={'noNew'}></div>
            )
          )}
      </TextField>
      {showNew && (
        <NewArtifactCategory
          discussion={discussion}
          resource={resource}
          onAdded={categoryAdded}
          onCancelled={cancelNewCategory}
        />
      )}
    </StyledBox>
  );
};

const mapRecordsToProps = {
  artifactCategories: (q: QueryBuilder) => q.findRecords('artifactcategory'),
};

export default withData(mapRecordsToProps)(SelectArtifactCategory) as any;
