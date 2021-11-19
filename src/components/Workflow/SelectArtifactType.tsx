import {
  createStyles,
  IconButton,
  makeStyles,
  MenuItem,
  TextField,
  Theme,
} from '@material-ui/core';
import { useState } from 'react';
import { IArtifactType, useArtifactType } from '../../crud/useArtifactType';
import { ISelectArtifactTypeStrings, IState } from '../../model';
import AddIcon from '@material-ui/icons/Add';
import CancelIcon from '@material-ui/icons/CancelOutlined';
import { connect } from 'react-redux';
import localStrings from '../../selector/localize';

interface IStateProps {
  t: ISelectArtifactTypeStrings;
}
interface IProps extends IStateProps {
  onTypeChange: (artifactTypeId: string) => void;
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
export const SelectArtifactType = (props: IProps) => {
  const { onTypeChange, allowNew, t } = props;
  const classes = useStyles();
  const [artifactType, setArtifactType] = useState('vernacular');
  const [newArtifactType, setNewArtifactType] = useState('');
  const [showNew, setShowNew] = useState(false);
  const { getArtifactTypes, addNewArtifactType } = useArtifactType();
  const [artifactTypes, setArtifactTypes] = useState(getArtifactTypes());
  const addNewType = async () => {
    await addNewArtifactType(newArtifactType);
    setArtifactTypes(getArtifactTypes());
    setArtifactType(newArtifactType);
    onTypeChange(newArtifactType);
    cancelNewType();
  };
  const cancelNewType = () => {
    setNewArtifactType('');
    setShowNew(false);
  };
  const handleArtifactTypeChange = (e: any) => {
    if (e.target.value === t.addNewType) setShowNew(true);
    else {
      setArtifactType(e.target.value);
      onTypeChange(e.target.value);
    }
  };
  const handleNewArtifactTypeChange = (e: any) => {
    setNewArtifactType(e.target.value);
  };

  return (
    <div className={classes.container}>
      <TextField
        id="artifact-type"
        select
        label={t.artifactType}
        className={classes.textField}
        value={artifactType}
        onChange={handleArtifactTypeChange}
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
        {artifactTypes
          .sort()
          .map((option: IArtifactType) => (
            <MenuItem key={option.id} value={option.id}>
              {option.type}
            </MenuItem>
          ))
          .concat(
            allowNew ? (
              <MenuItem key={t.addNewType} value={t.addNewType}>
                {t.addNewType + '\u00A0\u00A0'}
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
            id="new-artifact-type"
            label={t.newArtifactType}
            className={classes.newTextField}
            value={newArtifactType}
            onChange={handleNewArtifactTypeChange}
          ></TextField>
          <IconButton
            id="addnew"
            color="secondary"
            aria-label="addnew"
            onClick={addNewType}
          >
            <AddIcon />
          </IconButton>
          <IconButton
            id="cancelnew"
            color="secondary"
            aria-label="cancelnew"
            onClick={cancelNewType}
          >
            <CancelIcon />
          </IconButton>
        </div>
      )}
    </div>
  );
};
const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'SelectArtifactType' }),
});
export default connect(mapStateToProps)(SelectArtifactType);
