import { Box, Paper } from '@mui/material';
import React, { useEffect } from 'react';
import {
  ActionRow,
  AltButton,
  ILanguage,
  Language,
  PriButton,
} from '../../control';
import { IDialog } from '../../model';
import { useSelector, shallowEqual } from 'react-redux';
import { sharedSelector } from '../../selector';
import Mode from '../../model/dialogMode';
import { ResourceDescription, ResourceTitle } from '.';

const initState = {
  title: '',
  description: '',
  bcp47: 'und',
  languageName: '',
  font: '',
  spellCheck: false,
  terms: '',
  keywords: '',
};
export const initResourceState = { ...initState };
export type IResourceDialog = typeof initState;

export interface IResourceState {
  state: IResourceDialog;
  setState: React.Dispatch<React.SetStateAction<IResourceDialog>>;
}

interface IProps extends IDialog<IResourceDialog> {
  nameInUse?: (newName: string) => boolean;
}

export default function ResourceOverview(props: IProps) {
  const { mode, values, isOpen, onOpen, onCommit, onCancel } = props;
  const [state, setState] = React.useState({ ...initState });
  const { title, bcp47 } = state;
  const ts = useSelector(sharedSelector, shallowEqual);

  useEffect(() => {
    setState(!values ? { ...initState } : { ...values });
  }, [values, isOpen]);

  const handleClose = () => {
    if (onOpen) onOpen(false);
    if (onCancel) onCancel();
  };

  const handleAdd = () => {
    if (onOpen) onOpen(false);
    onCommit(state);
  };

  const handleLanguageChange = (val: ILanguage) => {
    setState((state) => ({ ...state, ...val }));
  };

  return (
    <Paper>
      <Box>
        <ResourceTitle state={state} setState={setState} />
        <ResourceCategory state={state} setState={setState} />
        <ResourceDescription state={state} setState={setState} />
        <Language {...state} onChange={handleLanguageChange} />
        <ResourceTerms state={state} setState={setState} />
        <ResourceKeywords state={state} setState={setState} />
      </Box>
      <ActionRow>
        <AltButton id="resCancel" onClick={handleClose}>
          {ts.cancel}
        </AltButton>
        <PriButton
          id="resSave"
          onClick={handleAdd}
          disabled={title === '' || bcp47 === 'und'}
        >
          {mode === Mode.add ? ts.add : ts.save}
        </PriButton>
      </ActionRow>
    </Paper>
  );
}
