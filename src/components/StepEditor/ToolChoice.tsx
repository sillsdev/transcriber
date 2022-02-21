import { IState, IStepEditorStrings, OptionType } from '../../model';
import { connect } from 'react-redux';
import localStrings from '../../selector/localize';
import { makeStyles, createStyles, Theme } from '@material-ui/core';
import { TextField, MenuItem } from '@material-ui/core';
import { useTools } from '../../crud';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    textField: {
      marginLeft: theme.spacing(1),
      marginRight: theme.spacing(1),
      display: 'flex',
      flexGrow: 1,
    },
    menu: {
      width: 300,
    },
  })
);

interface IStateProps {
  t: IStepEditorStrings;
}

interface IProps extends IStateProps {
  tool: string;
  onChange: (tool: string) => void;
}

export const ToolChoice = ({ tool, onChange, t }: IProps) => {
  const classes = useStyles();
  const { getToolOptions } = useTools();

  const handleChange = (e: any) => {
    onChange(e.target.value);
  };

  return (
    <TextField
      id="stepTool"
      select
      label={t.tool}
      value={tool}
      onChange={handleChange}
      variant="filled"
      className={classes.textField}
      SelectProps={{
        MenuProps: {
          className: classes.menu,
        },
      }}
    >
      {getToolOptions().map((option: OptionType, i) => (
        <MenuItem key={i} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </TextField>
  );
};

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'stepEditor' }),
});

export default connect(mapStateToProps)(ToolChoice) as any;
