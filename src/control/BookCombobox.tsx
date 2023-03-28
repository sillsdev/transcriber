import React, { ChangeEvent } from 'react';
import { IControlStrings, OptionType } from '../model';
import {
  TextField,
  Autocomplete,
  AutocompleteChangeReason,
  AutocompleteRenderInputParams,
} from '@mui/material';
import { shallowEqual, useSelector } from 'react-redux';
import { controlSelector } from '../selector';

interface IProps {
  value: OptionType | null;
  suggestions: OptionType[];
  onCommit: (newValue: OptionType | null) => void;
  variant?: 'filled' | 'standard' | 'outlined' | undefined;
}

export const BookCombobox = (props: IProps) => {
  const { value, suggestions, variant } = props;
  const t: IControlStrings = useSelector(controlSelector, shallowEqual);

  const handleChange = (
    e: ChangeEvent<{}>,
    newValue: OptionType | null,
    reason: AutocompleteChangeReason
  ) => {
    const { onCommit } = props;
    onCommit(newValue);
  };

  const handleGetLabel = (option: OptionType) => option.label;

  const handleRenderInput = (params: AutocompleteRenderInputParams) => (
    <TextField
      {...params}
      variant={variant || 'filled'}
      required
      label={t.book}
      margin="normal"
    />
  );

  return (
    <Autocomplete
      id="book-combobox"
      sx={{ mx: 1, with: '256px' }}
      options={suggestions}
      openOnFocus
      autoHighlight
      value={value}
      onChange={handleChange}
      getOptionLabel={handleGetLabel}
      renderInput={handleRenderInput}
    />
  );
};

export default BookCombobox;
