import {
  createStyles,
  makeStyles,
  MenuItem,
  TextField,
  Theme,
} from '@material-ui/core';
import { useEffect, useState } from 'react';
import {
  ArtifactTypeSlug,
  IArtifactType,
  useArtifactType,
} from '../../crud/useArtifactType';
import { ISelectArtifactTypeStrings, IState } from '../../model';
import { connect } from 'react-redux';
import localStrings from '../../selector/localize';

interface IStateProps {
  t: ISelectArtifactTypeStrings;
}
interface IProps extends IStateProps {
  onTypeChange: (artifactTypeId: string | null) => void;
  initialValue?: string | null;
  limit?: ArtifactTypeSlug[];
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
  const { onTypeChange, initialValue, limit, t } = props;
  const classes = useStyles();
  const [artifactType, setArtifactType] = useState(
    ArtifactTypeSlug.Vernacular as string
  );
  const { getArtifactTypes } = useArtifactType();
  const [artifactTypes, setArtifactTypes] = useState<IArtifactType[]>([]);

  const handleArtifactTypeChange = (e: any) => {
    setArtifactType(e.target.value);
    onTypeChange(
      e.target.value === (ArtifactTypeSlug.Vernacular as string)
        ? null
        : e.target.value
    );
  };

  useEffect(() => {
    setArtifactTypes(
      getArtifactTypes(limit, true).map((a, i) =>
        !a.id ? { ...a, id: ArtifactTypeSlug.Vernacular as string } : a
      )
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit]);

  useEffect(() => {
    setArtifactType(
      initialValue ? initialValue : (ArtifactTypeSlug.Vernacular as string)
    );
  }, [initialValue]);

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
        {
          artifactTypes.map((option: IArtifactType) => (
            <MenuItem key={option.id} value={option.id}>
              {option.type}
            </MenuItem>
          )) /*
          .concat(
            allowNew ? (
              <MenuItem key={t.addNewType} value={t.addNewType}>
                {t.addNewType + '\u00A0\u00A0'}
                <AddIcon />
              </MenuItem>
            ) : (
              <></>
            )) */
        }
      </TextField>
    </div>
  );
};
const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'selectArtifactType' }),
});
export default connect(mapStateToProps)(SelectArtifactType);
