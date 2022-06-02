import { createStyles, makeStyles, TextField, Theme } from '@material-ui/core';
import { useState } from 'react';
import { connect } from 'react-redux';
import { ISharedStrings, IState } from '../../../model';
import { localStrings } from '../../../selector';
import SelectArtifactCategory, {
  ScriptureEnum,
} from '../../Workflow/SelectArtifactCategory';
import { PassageResourceButton } from './PassageResourceButton';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    formControl: {
      margin: theme.spacing(1),
    },
  })
);
interface IStateProps {
  ts: ISharedStrings;
}
interface IProps extends IStateProps {
  initCategory: string; //id
  initDescription: string;
  initPassRes: boolean;
  onCategoryChange: (artifactCategoryId: string) => void;
  onDescriptionChange: (desc: string) => void;
  onPassResChange: () => void;
  catRequired: boolean;
  catAllowNew?: boolean;
}
export function ResourceData(props: IProps) {
  const {
    ts,
    initCategory,
    initDescription,
    initPassRes,
    onCategoryChange,
    onDescriptionChange,
    onPassResChange,
    catRequired,
    catAllowNew,
  } = props;
  const classes = useStyles();
  const [description, setDescription] = useState(initDescription);

  const handleChangeDescription = (e: any) => {
    e.persist();
    setDescription(e.target.value);
    onDescriptionChange(e.target.value);
  };

  return (
    <div>
      <TextField
        className={classes.formControl}
        id="filename"
        label={ts.description}
        value={description}
        onChange={handleChangeDescription}
        required={false}
        fullWidth={true}
      />
      <SelectArtifactCategory
        allowNew={catAllowNew}
        initCategory={initCategory}
        onCategoryChange={onCategoryChange}
        required={catRequired}
        scripture={ScriptureEnum.highlight}
        resource={true}
      />
      <PassageResourceButton value={initPassRes} cb={onPassResChange} />
    </div>
  );
}
const mapStateToProps = (state: IState): IStateProps => ({
  ts: localStrings(state, { layout: 'shared' }),
});

export default connect(mapStateToProps)(ResourceData) as any;
