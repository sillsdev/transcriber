import React, { ChangeEvent } from 'react';
import { OptionType } from '../model';
import {
  TextField,
  Autocomplete,
  AutocompleteChangeReason,
  AutocompleteRenderInputParams,
} from '@mui/material';

const t = {
  book: 'Book',
};

interface IProps {
  value: OptionType | null;
  suggestions: OptionType[];
  onCommit: (newValue: OptionType | null) => void;
  variant?: 'filled' | 'standard' | 'outlined' | undefined;
}

export const BookCombobox = (props: IProps) => {
  const { value, suggestions, variant } = props;

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
