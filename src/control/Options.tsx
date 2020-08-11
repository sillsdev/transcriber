import React from 'react';
import keycode from 'keycode';
import { connect } from 'react-redux';
import localStrings from '../selector/localize';
import { IControlStrings, IState } from '../model';
import {
  FormLabel,
  FormControlLabel,
  RadioGroup,
  Radio,
  TextField,
} from '@material-ui/core';
import { makeStyles, createStyles, Theme } from '@material-ui/core';
import { TeamContext } from '../context/TeamContext';
import { toCamel, camel2Title } from '../utils';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      paddingTop: theme.spacing(4),
    },
    label: {
      color: theme.palette.secondary.main,
    },
    otherBox: {
      marginBottom: theme.spacing(2),
    },
  })
);

export interface IDecorations {
  [key: string]: JSX.Element;
}

interface IStateProps {
  tc: IControlStrings;
}

interface IProps extends IStateProps {
  label: string;
  defaultValue?: string;
  options: string[];
  onChange: (option: string) => void;
  addOption?: (option: string) => void;
  decorations?: IDecorations;
  required?: boolean;
}

const OptionCtrl = (props: IProps) => {
  const {
    label,
    defaultValue,
    options,
    onChange,
    addOption,
    tc,
    decorations,
    required,
  } = props;
  const classes = useStyles();
  const ctx = React.useContext(TeamContext);
  const t = ctx.state.vProjectStrings;
  const [other, setOther] = React.useState<string | null>('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!addOther()) onChange(e.target.value);
  };

  const handleOther = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.persist();
    setOther(e.target.value);
  };

  const addOther = () => {
    if (other !== '') {
      const newTag = toCamel(other || '');
      if (!options.includes(newTag)) {
        addOption && addOption(newTag);
      }
      onChange(newTag);
      setOther('');
      return true;
    }
    return false;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.keyCode === keycode('ENTER') || e.keyCode === keycode('TAB')) {
      addOther();
    }
  };

  return (
    <div className={classes.root}>
      <FormLabel required={required} className={classes.label}>
        {label}
      </FormLabel>
      <RadioGroup
        value={other !== '' ? other : defaultValue || ''}
        onChange={handleChange}
      >
        {options.map((k, i) => {
          return (
            <FormControlLabel
              key={i}
              value={k}
              control={<Radio />}
              label={
                <>
                  {tc.hasOwnProperty(k) ? tc.getString(k) : camel2Title(k)}
                  {'\u00A0 '}
                  {decorations &&
                    decorations.hasOwnProperty(k) &&
                    decorations[k]}
                </>
              }
            />
          );
        })}
        {addOption && (
          <FormControlLabel
            key="99"
            control={<Radio />}
            label={
              <TextField
                id="other-option"
                margin="dense"
                className={classes.otherBox}
                label={t.other}
                value={other}
                onChange={handleOther}
                onKeyDown={handleKeyDown}
                onBlur={addOther}
              />
            }
          />
        )}
      </RadioGroup>
    </div>
  );
};

const mapStateToProps = (state: IState): IStateProps => ({
  tc: localStrings(state, { layout: 'control' }),
});

export const Options = connect(mapStateToProps)(OptionCtrl);
