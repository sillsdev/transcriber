import {
  createStyles,
  IconButton,
  makeStyles,
  MenuItem,
  TextField,
  Theme,
} from '@material-ui/core';
import { useEffect, useState } from 'react';
import {
  IArtifactCategory,
  useArtifactCategory,
} from '../../crud/useArtifactCategory';
import {
  ArtifactCategory,
  ISelectArtifactCategoryStrings,
  IState,
} from '../../model';
import AddIcon from '@material-ui/icons/Add';
import InfoIcon from '@material-ui/icons/Info';
import CancelIcon from '@material-ui/icons/CancelOutlined';
import { connect } from 'react-redux';
import localStrings from '../../selector/localize';
import { useSnackBar } from '../../hoc/SnackBar';
import { QueryBuilder } from '@orbit/data';
import { withData } from '../../mods/react-orbitjs';
import { LightTooltip } from '../../control';

interface IRecordProps {
  artifactCategories: Array<ArtifactCategory>;
}
interface IStateProps {
  t: ISelectArtifactCategoryStrings;
}
export enum ScriptureEnum {
  hide,
  highlight,
}
interface IProps extends IStateProps, IRecordProps {
  initCategory: string; //id
  onCategoryChange: (artifactCategoryId: string) => void;
  required: boolean;
  allowNew?: boolean;
  scripture?: ScriptureEnum;
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    container: {
      display: 'flex',
      flexDirection: 'column',
    },
    row: {
      display: 'flex',
      flexDirection: 'row',
    },
    textField: {
      marginLeft: theme.spacing(1),
      marginRight: theme.spacing(1),
      width: 'inherit',
      maxWidth: '400px',
      minWidth: '200px',
    },
    newTextField: {
      marginLeft: theme.spacing(1),
      marginRight: theme.spacing(1),
      width: 300,
    },
    menu: {
      width: 300,
    },
    formTextInput: {
      fontSize: 'small',
    },
    formTextLabel: {
      fontSize: 'small',
    },
    info: {
      color: theme.palette.primary.light,
    },
  })
);
export const SelectArtifactCategory = (props: IProps) => {
  const {
    onCategoryChange,
    allowNew,
    required,
    t,
    artifactCategories,
    initCategory,
    scripture,
  } = props;
  const classes = useStyles();
  const [categoryId, setCategoryId] = useState(initCategory);
  const [newArtifactCategory, setNewArtifactCategory] = useState('');
  const [showNew, setShowNew] = useState(false);
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
    var cats = await getArtifactCategorys();
    if (scripture === ScriptureEnum.hide)
      cats = cats.filter((c) => !scriptureTypeCategory(c.slug));
    return cats;
  };

  useEffect(() => {
    getCategorys().then((cats) => setArtifactCategorys(cats));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artifactCategories]);

  const addNewCategory = () => {
    addNewArtifactCategory(newArtifactCategory).then((newId) => {
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
    <div className={classes.container}>
      <TextField
        id="artifact-category"
        select
        label={t.artifactCategory}
        className={classes.textField}
        value={categoryId}
        onChange={handleArtifactCategoryChange}
        SelectProps={{
          MenuProps: {
            className: classes.menu,
          },
        }}
        InputProps={{
          classes: {
            input: classes.formTextInput,
          },
        }}
        InputLabelProps={{
          classes: {
            root: classes.formTextLabel,
          },
        }}
        margin="normal"
        variant="filled"
        required={required}
      >
        {artifactCategorys
          .sort((i, j) => (i.category < j.category ? -1 : 1))
          .map((option: IArtifactCategory, i) => (
            <MenuItem key={i} value={option.id}>
              {option.category + '\u00A0\u00A0'}
              {scripture === ScriptureEnum.highlight ? (
                scriptureTypeCategory(option.slug) ? (
                  <LightTooltip title={t.scriptureHighlight}>
                    <InfoIcon className={classes.info} />
                  </LightTooltip>
                ) : (
                  <></>
                )
              ) : (
                <></>
              )}
            </MenuItem>
          ))
          .concat(
            allowNew ? (
              <MenuItem key={t.addNewCategory} value={t.addNewCategory}>
                {t.addNewCategory + '\u00A0\u00A0'}
                <AddIcon />
              </MenuItem>
            ) : (
              <div key={'noNew'}></div>
            )
          )}
      </TextField>
      {showNew && (
        <div className={classes.row}>
          <TextField
            id="new-artifact-cat"
            label={t.newArtifactCategory}
            className={classes.newTextField}
            value={newArtifactCategory}
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
        </div>
      )}
    </div>
  );
};
const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'selectArtifactCategory' }),
});
const mapRecordsToProps = {
  artifactCategories: (q: QueryBuilder) => q.findRecords('artifactcategory'),
};

export default withData(mapRecordsToProps)(
  connect(mapStateToProps)(SelectArtifactCategory) as any
) as any;
