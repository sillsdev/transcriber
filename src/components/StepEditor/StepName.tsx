import { IState, IStepEditorStrings } from '../../model';
import { connect } from 'react-redux';
import localStrings from '../../selector/localize';
import { makeStyles, createStyles, Theme } from '@material-ui/core';
import { TextField } from '@material-ui/core';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    textField: {
      marginLeft: theme.spacing(1),
      marginRight: theme.spacing(1),
      display: 'flex',
      flexGrow: 1,
    },
  })
);

interface IStateProps {
  t: IStepEditorStrings;
}

interface IProps extends IStateProps {
  name: string;
  onChange: (name: string) => void;
}

export const StepName = ({ name, onChange, t }: IProps) => {
  const classes = useStyles();

  const handleChange = (e: any) => {
    onChange(e.target.value);
  };

  return (
    <TextField
      id="stepName"
      label={t.name}
      value={name}
      onChange={handleChange}
      variant="filled"
      className={classes.textField}
    />
  );
};

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'stepEditor' }),
});

export default connect(mapStateToProps)(StepName) as any;
