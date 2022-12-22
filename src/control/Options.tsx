import React from 'react';
import keycode from 'keycode';
import { shallowEqual, useSelector } from 'react-redux';
import { IControlStrings } from '../model';
import {
  FormLabel,
  FormControlLabel,
  RadioGroup,
  Radio,
  TextField,
  Box,
} from '@mui/material';
import { controlSelector } from '../selector';

export interface IDecorations {
  [key: string]: JSX.Element;
}

interface IProps {
  label: string;
  defaultValue?: string;
  options: string[];
  onChange: (option: string) => void;
  addOption?: (option: string) => boolean;
  otherLabel?: string;
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
    decorations,
    required,
    otherLabel,
  } = props;
  const [other, setOther] = React.useState<string | null>('');
  const tc: IControlStrings = useSelector(controlSelector, shallowEqual);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!addOther()) onChange(e.target.value);
  };

  const handleOther = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.persist();
    setOther(e.target.value);
  };

  const addOther = () => {
    const newTag = other || '';
    if (
      newTag !== '' &&
      !options.includes(newTag) &&
      addOption &&
      addOption(newTag)
    ) {
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
    <Box sx={{ pt: 4 }}>
      <FormLabel required={required} sx={{ color: 'secondary.main' }}>
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
                <Box sx={{ display: 'flex' }}>
                  {tc.hasOwnProperty(k) ? tc.getString(k) : k}
                  {'\u00A0 '}
                  {decorations &&
                    decorations.hasOwnProperty(k) &&
                    decorations[k]}
                </Box>
              }
            />
          );
        })}
        {addOption && (
          <FormControlLabel
            key="99"
            control={<Radio />}
            disabled={other === ''}
            label={
              <TextField
                id="other-option"
                margin="dense"
                sx={{ mb: 2 }}
                label={otherLabel}
                value={other}
                onChange={handleOther}
                onKeyDown={handleKeyDown}
                onBlur={addOther}
              />
            }
          />
        )}
      </RadioGroup>
    </Box>
  );
};

export const Options = OptionCtrl;
