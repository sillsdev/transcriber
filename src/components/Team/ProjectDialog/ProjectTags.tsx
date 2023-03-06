import React, { useState } from 'react';
import keycode from 'keycode';
import { ITag } from '../../../model';
import {
  FormLabel,
  FormControlLabel,
  Checkbox,
  TextField,
  FormGroup,
} from '@mui/material';
import { IProjectDialogState } from './ProjectDialog';
import { useEffect } from 'reactn';
import { localizeProjectTag } from '../../../utils/localizeProjectTag';

export const ProjectTags = (props: IProjectDialogState) => {
  const { state, setState } = props;
  const { tags } = state;
  const t = state.vProjectStrings;

  const [check, setCheck] = useState<ITag>({
    [t.training]: false,
  });
  const [other, setOther] = useState('');

  useEffect(() => {
    let checks: ITag = { ...check };
    Object.keys(tags).map((k, i) => {
      checks = { ...checks, [localizeProjectTag(k, t)]: tags[k] };
      return k;
    });
    setCheck(checks);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tags]);

  const localToTag = (localized: ITag) => {
    let tag = {};
    Object.keys(localized).map((k) => {
      switch (k) {
        case t.training:
          tag = { ...tag, training: localized[k] };
          break;
        default:
          tag = { ...tag, [k]: localized[k] };
          break;
      }
      return k;
    });
    return tag;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.persist();
    if (e.target.name !== '' && e.target.name !== '<o>') {
      const checks = { ...check, [e.target.name]: e.target.checked };
      setCheck(checks);
      setState((state) => ({ ...state, tags: localToTag(checks) }));
    }
  };

  const handleOther = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.persist();
    setOther(e.target.value);
  };

  const addOther = () => {
    if (other !== '' && other !== '<o>') {
      const newTag = other;
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
      <FormLabel sx={{ color: 'secondary.main' }}>{t.tags}</FormLabel>
      <FormGroup>
        {Object.keys(check).map((k, i) => {
          return (
            <FormControlLabel
              key={i}
              control={
                <Checkbox checked={check[k]} onChange={handleChange} name={k} />
              }
              label={k}
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
              sx={{ mb: 2 }}
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
