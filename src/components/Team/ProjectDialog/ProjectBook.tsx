import React from 'react';
import { FormLabel, TextField, Typography } from '@mui/material';
import { IProjectDialogState } from './ProjectDialog';
import { shallowEqual, useSelector } from 'react-redux';
import { vProjectSelector } from '../../../selector';
import { IState, OptionType } from '../../../model';
import { useRef } from 'reactn';
import BookSelect from '../../BookSelect';

export const ProjectBook = (props: IProjectDialogState) => {
  const { state, setState, setBookErr } = props;
  const t = useSelector(vProjectSelector, shallowEqual);
  const { book, type } = state;
  const [newBook, setNewBook] = React.useState<string>(book);
  const [errmsg, setErrmsgx] = React.useState<string>('');
  const bookSuggestions = useSelector(
    (state: IState) => state.books.suggestions
  );
  const suggestionRef = useRef<Array<OptionType>>();

  const setErrmsg = (bookErr: string) => {
    setErrmsgx(bookErr);
    setBookErr && setBookErr(bookErr);
  };
  React.useEffect(() => {
    suggestionRef.current = bookSuggestions;
  }, [bookSuggestions]);

  const handleChangeBook = (e: any) => {
    e.persist();
    var newbook = (e.target?.value || '').toString().toUpperCase();
    setNewBook(newbook);
    if (bookSuggestions.find((s) => s.value === newbook)) {
      setErrmsg(t.errExtrasBookNonScripture);
      setState((state) => ({ ...state, book: '' }));
    } else if (newbook.length > 0 && newbook.length < 3) {
      setErrmsg(t.errExtrasBookLen);
      setState((state) => ({ ...state, book: '' }));
    } else {
      setState((state) => ({ ...state, book: newbook }));
      setErrmsg('');
    }
  };
  const handleSetPreventSave = (val: boolean) => {};

  const onCommit = (
    newbook: string,
    e?: React.KeyboardEvent<Element> | undefined
  ) => {
    setNewBook(newbook);
    setState((state) => ({ ...state, book: newbook }));
  };
  const onCancel = () => {};
  //future default book for scripture tested but turned off for now
  return (
    <div>
      {type !== 'scripture' && (
        <>
          <FormLabel sx={{ color: 'secondary.main' }}>{t.extrasBook}</FormLabel>
          {type === 'scripture' ? (
            <BookSelect
              onCommit={onCommit}
              onRevert={onCancel}
              suggestions={suggestionRef.current ? suggestionRef.current : []}
              placeHolder={t.bookSelect}
              setPreventSave={handleSetPreventSave}
              autoFocus={false}
              {...props}
            />
          ) : (
            <>
              <TextField
                margin="dense"
                id="extraBook"
                value={newBook}
                onChange={handleChangeBook}
                fullWidth
                inputProps={{ maxLength: 3 }}
              />
              {errmsg && <Typography color="red">{errmsg}</Typography>}
            </>
          )}
        </>
      )}
    </div>
  );
};
