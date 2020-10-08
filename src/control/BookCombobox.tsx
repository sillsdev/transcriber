import React, { ChangeEvent } from 'react';
import { OptionType } from '../model';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import { TextField } from '@material-ui/core';
import Autocomplete, {
  AutocompleteChangeReason,
  AutocompleteRenderInputParams,
} from '@material-ui/lab/Autocomplete';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    book: {
      marginLeft: theme.spacing(1),
      marginRight: theme.spacing(1),
      width: 256,
    },
  })
);

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
  const classes = useStyles();

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
      className={classes.book}
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
