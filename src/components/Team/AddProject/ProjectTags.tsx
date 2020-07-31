import React from 'react';
import keycode from 'keycode';
import {
  // Grid,
  FormLabel,
  FormControlLabel,
  Checkbox,
  TextField,
  FormGroup,
} from '@material-ui/core';
import { makeStyles, createStyles, Theme } from '@material-ui/core';
import { IAddProjectState } from './AddProject';
import { toCamel, camel2Title } from '../../../utils';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    label: {
      color: theme.palette.secondary.main,
    },
    otherBox: {
      marginBottom: theme.spacing(2),
    },
  })
);

export interface ITag {
  [tag: string]: boolean;
}

const t = {
  tags: 'Tags',
  other: 'Other',
};

export const ProjectTags = (props: IAddProjectState) => {
  const classes = useStyles();
  const { state, setState } = props;
  const { tags } = state;
  const [check, setCheck] = React.useState<ITag>({
    testing: false,
    training: false,
    backTranslation: false,
    ...tags,
  });
  const [other, setOther] = React.useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.persist();
    const checks = { ...check, [e.target.name]: e.target.checked };
    setCheck(checks);
    setState((state) => ({ ...state, tags: checks }));
  };

  const handleOther = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.persist();
    setOther(e.target.value);
  };

  const addOther = () => {
    if (other !== '') {
      const newTag = toCamel(other);
      const checks = { ...check, [newTag]: true };
      setCheck(checks);
      setState((state) => ({ ...state, tags: checks }));
      setOther('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.keyCode === keycode('ENTER') || e.keyCode === keycode('TAB')) {
      addOther();
    }
  };

  return (
    <>
      <FormLabel className={classes.label}>{t.tags}</FormLabel>
      <FormGroup>
        {Object.keys(check).map((k, i) => {
          return (
            <FormControlLabel
              key={i}
              control={
                <Checkbox checked={check[k]} onChange={handleChange} name={k} />
              }
              label={camel2Title(k)}
            />
          );
        })}
        <FormControlLabel
          key="99"
          control={
            <Checkbox
              checked={other !== ''}
              onChange={handleChange}
              name={'<o>'}
            />
          }
          label={
            <TextField
              id="other-tag"
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
      </FormGroup>
    </>
  );
};
