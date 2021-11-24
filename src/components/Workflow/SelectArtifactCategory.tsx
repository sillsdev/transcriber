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
import { ISelectArtifactCategoryStrings, IState } from '../../model';
import AddIcon from '@material-ui/icons/Add';
import CancelIcon from '@material-ui/icons/CancelOutlined';
import { connect } from 'react-redux';
import localStrings from '../../selector/localize';
import { useSnackBar } from '../../hoc/SnackBar';

interface IStateProps {
  t: ISelectArtifactCategoryStrings;
}
interface IProps extends IStateProps {
  initCategory: string; //id
  onCategoryChange: (artifactCategoryId: string) => void;
  allowNew?: boolean;
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
      width: 400,
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
  })
);
export const SelectArtifactCategory = (props: IProps) => {
  const { onCategoryChange, allowNew, t, initCategory } = props;
  const classes = useStyles();
  const [categoryId, setCategoryId] = useState(initCategory);
  const [newArtifactCategory, setNewArtifactCategory] = useState('');
  const [showNew, setShowNew] = useState(false);
  const { getArtifactCategorys, addNewArtifactCategory } =
    useArtifactCategory();
  const [artifactCategorys, setArtifactCategorys] = useState(
    getArtifactCategorys()
  );
  const { showMessage } = useSnackBar();
  useEffect(() => {
    setCategoryId(initCategory);
  }, [initCategory]);

  const addNewCategory = () => {
    addNewArtifactCategory(newArtifactCategory).then((newId) => {
      if (newId) {
        if (newId === 'duplicate') {
          showMessage(t.duplicateCategory);
        } else {
          setCategoryId(newId);
          setArtifactCategorys(getArtifactCategorys());
          onCategoryChange(newId);
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
        required={true}
      >
        {artifactCategorys
          .sort()
          .map((option: IArtifactCategory) => (
            <MenuItem key={option.id} value={option.id}>
              {option.category}
            </MenuItem>
          ))
          .concat(
            allowNew ? (
              <MenuItem key={t.addNewCategory} value={t.addNewCategory}>
                {t.addNewCategory + '\u00A0\u00A0'}
                <AddIcon />
              </MenuItem>
            ) : (
              <></>
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
export default connect(mapStateToProps)(SelectArtifactCategory);
