import React, {
  ChangeEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Checkbox,
  FormControlLabel,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { IProjectDialogState } from './ProjectDialog';
import { shallowEqual, useSelector } from 'react-redux';
import { vProjectSelector } from '../../../selector';
import { IState, IVProjectStrings, OptionType } from '../../../model';
import { Akuo } from '../../../assets/brands';

export const ProjectBook = (props: IProjectDialogState) => {
  const { state, setState, setBookErr } = props;
  const t: IVProjectStrings = useSelector(vProjectSelector, shallowEqual);
  const { book, story, type } = state;
  const [newBook, setNewBook] = useState<string>(book);
  const [errmsg, setErrmsgx] = useState<string>('');
  const [newStory, setNewStory] = useState(story);
  const bookSuggestions = useSelector(
    (state: IState) => state.books.suggestions
  );
  const suggestionRef = useRef<Array<OptionType>>();

  const setErrmsg = (bookErr: string) => {
    setErrmsgx(bookErr);
    setBookErr && setBookErr(bookErr);
  };
  useEffect(() => {
    suggestionRef.current = bookSuggestions;
  }, [bookSuggestions]);

  const isScripture = useMemo(() => type === 'scripture', [type]);

  const handleChangeBook = (e: any) => {
    e.persist();
    var newbook = (e.target?.value || '').trim().toString().toUpperCase();
    setNewBook(newbook);
    if (bookSuggestions.find((s) => s.value === newbook)) {
      setErrmsg(t.errgeneralBookNonScripture);
      setState((state) => ({ ...state, book: '' }));
    } else if (newbook.length > 0 && newbook.length < 3) {
      setErrmsg(t.errgeneralBookLen);
      setState((state) => ({ ...state, book: '' }));
    } else {
      setState((state) => ({ ...state, book: newbook }));
      setErrmsg('');
    }
  };
  const handleCheckboxChange = (
    _event: ChangeEvent<HTMLInputElement>,
    checked: boolean
  ) => {
    setNewStory(checked);
    setState((state) => ({ ...state, story: checked }));
  };

  //future default book for scripture tested but turned off for now
  return (
    <Stack
      direction="row"
      spacing={2}
      sx={{
        boxShadow: isScripture ? 0 : 2,
        borderRadius: '5px',
        p: isScripture ? 0 : 1,
        alignItems: 'center',
      }}
    >
      <TextField
        required
        margin="dense"
        id="extraBook"
        label={t.generalBook.replace('{0}', Akuo)}
        value={newBook}
        onChange={handleChangeBook}
        inputProps={{ maxLength: 5 }}
        disabled={isScripture}
        helperText={!isScripture ? t.generalBookHelper : undefined}
      />
      {errmsg && <Typography color="red">{errmsg}</Typography>}
      {!isScripture && (
        <FormControlLabel
          control={
            <Checkbox
              checked={newStory}
              onChange={handleCheckboxChange}
              value="story"
            />
          }
          label={t.generalStory.replace('{0}', Akuo)}
        />
      )}
    </Stack>
  );
};
