import { Box, IconButton, Paper, SxProps, TextField } from '@mui/material';
import { useEffect, useState } from 'react';
import {
  IArtifactCategory,
  useArtifactCategory,
} from '../../crud/useArtifactCategory';
import { ArtifactCategory, ISelectArtifactCategoryStrings } from '../../model';
import AddIcon from '@mui/icons-material/Add';
import InfoIcon from '@mui/icons-material/Info';
import CancelIcon from '@mui/icons-material/CancelOutlined';
import { shallowEqual, useSelector } from 'react-redux';
import { useSnackBar } from '../../hoc/SnackBar';
import { QueryBuilder } from '@orbit/data';
import { withData } from 'react-orbitjs';
import { LightTooltip, StyledMenuItem } from '../../control';
import { artifactCategorySelector } from '../../selector';

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
}

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
  } = props;
  const [categoryId, setCategoryId] = useState(initCategory);
  const [newArtifactCategory, setNewArtifactCategory] = useState('');
  const [showNew, setShowNew] = useState(false);
  const t: ISelectArtifactCategoryStrings = useSelector(
    artifactCategorySelector,
    shallowEqual
  );
  const {
    getArtifactCategorys,
    addNewArtifactCategory,
    scriptureTypeCategory,
  } = useArtifactCategory();
  const [artifactCategorys, setArtifactCategorys] = useState<
    IArtifactCategory[]
  >([]);

  const { showMessage } = useSnackBar();
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

  const addNewCategory = () => {
    addNewArtifactCategory(
      newArtifactCategory,
      resource || false,
      discussion || false
    ).then((newId) => {
      if (newId) {
        if (newId === 'duplicate') {
          showMessage(t.duplicateCategory);
        } else {
          getCategorys().then((cats) => {
            setArtifactCategorys(cats);
            setCategoryId(newId);
            onCategoryChange(newId);
          });
        }
      }
      cancelNewCategory();
    });
  };
  const cancelNewCategory = () => {
    setNewArtifactCategory('');
    setShowNew(false);
  };
  const handleArtifactCategoryChange = (e: any) => {
    if (e.target.value === t.addNewCategory) setShowNew(true);
    else {
      setCategoryId(e.target.value);
      onCategoryChange(e.target.value);
    }
  };
  const handleNewArtifactCategoryChange = (e: any) => {
    setNewArtifactCategory(e.target.value);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <TextField
        id="artifact-category"
        select
        label={t.artifactCategory}
        sx={textFieldProps}
        value={categoryId || ''}
        onChange={handleArtifactCategoryChange}
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
          .map((option: IArtifactCategory, i) => (
            <StyledMenuItem key={i} value={option.id}>
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
            allowNew ? (
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
        <Paper>
          <Box sx={{ display: 'flex', flexDirection: 'row' }}>
            <TextField
              id="new-artifact-cat"
              label={t.newArtifactCategory}
              sx={{ mx: 1, width: '300px' }}
              value={newArtifactCategory || ''}
              onChange={handleNewArtifactCategoryChange}
            ></TextField>
            <IconButton
              id="addnew"
              color="secondary"
              aria-label="addnew"
              onClick={addNewCategory}
            >
              <AddIcon />
            </IconButton>
            <IconButton
              id="cancelnew"
              color="secondary"
              aria-label="cancelnew"
              onClick={cancelNewCategory}
            >
              <CancelIcon />
            </IconButton>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

const mapRecordsToProps = {
  artifactCategories: (q: QueryBuilder) => q.findRecords('artifactcategory'),
};

export default withData(mapRecordsToProps)(SelectArtifactCategory) as any;
