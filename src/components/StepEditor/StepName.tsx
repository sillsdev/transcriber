import { IState, IStepEditorStrings } from '../../model';
import { connect } from 'react-redux';
import localStrings from '../../selector/localize';
import { makeStyles, createStyles, Theme } from '@material-ui/core';
import { TextField } from '@material-ui/core';
import { useEffect, useState } from 'react';

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
  const [response, setResponse] = useState(name);

  const handleChange = (e: any) => {
    const name = e.target.value;
    setResponse(name);
    onChange(name);
  };

  useEffect(() => {
    setResponse(name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);

  return (
    <TextField
      id="stepName"
      label={t.name}
      value={response}
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
