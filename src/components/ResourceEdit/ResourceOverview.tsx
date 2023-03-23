import { Box, Divider, Stack } from '@mui/material';
import React, { useEffect } from 'react';
import {
  ActionRow,
  AltButton,
  GrowingDiv,
  ILanguage,
  Language,
  PriButton,
} from '../../control';
import { IDialog, IResourceStrings, ISharedStrings } from '../../model';
import { useSelector, shallowEqual } from 'react-redux';
import { sharedResourceSelector, sharedSelector } from '../../selector';
import Mode from '../../model/dialogMode';
import {
  ResourceCategory,
  ResourceDescription,
  ResourceKeywords,
  ResourceTerms,
  ResourceTitle,
} from '.';
import { useGlobal } from 'reactn';

export interface IResourceDialog {
  title: string;
  description: string;
  bcp47: string;
  languageName: string;
  font: string;
  spellCheck: boolean;
  terms: string;
  keywords: string;
  category: string;
}

const initState: IResourceDialog = {
  title: '',
  description: '',
  bcp47: 'und',
  languageName: '',
  font: '',
  spellCheck: false,
  terms: '',
  keywords: '',
  category: '',
};

export interface IResourceState {
  state: IResourceDialog;
  setState: React.Dispatch<React.SetStateAction<IResourceDialog>>;
}

interface IProps extends IDialog<IResourceDialog> {
  nameInUse?: (newName: string) => boolean;
  onDelete?: () => void;
}

export default function ResourceOverview(props: IProps) {
  const { mode, values, isOpen, onOpen, onCommit, onCancel, onDelete } = props;
  const [isDeveloper] = useGlobal('developer');
  const [state, setState] = React.useState({ ...initState });
  const { title, bcp47 } = state;
  const ts: ISharedStrings = useSelector(sharedSelector, shallowEqual);
  const t: IResourceStrings = useSelector(sharedResourceSelector, shallowEqual);

  useEffect(() => {
    setState(!values ? { ...initState } : { ...values });
  }, [values, isOpen]);

  const handleClose = () => {
    if (onOpen) onOpen(false);
    if (onCancel) onCancel();
  };

  const handleAdd = () => {
    onCommit(state);
  };

  const handleLanguageChange = (val: ILanguage) => {
    setState((state) => ({ ...state, ...val }));
  };

  const handleDelete = () => {
    onDelete && onDelete();
  };

  return (
    <Box>
      <Stack spacing={2}>
        <ResourceTitle state={state} setState={setState} />
        <ResourceDescription state={state} setState={setState} />
        <ResourceCategory state={state} setState={setState} />
        <Language
          {...state}
          onChange={handleLanguageChange}
          hideSpelling
          hideFont
        />
        <ResourceTerms state={state} setState={setState} />
        <ResourceKeywords state={state} setState={setState} />
      </Stack>
      <Divider sx={{ mt: 2 }} />
      <ActionRow>
        {isDeveloper && (
          <>
            <AltButton id="delete" onClick={handleDelete}>
              {t.delete}
            </AltButton>
            <GrowingDiv />
          </>
        )}
        <AltButton id="resCancel" onClick={handleClose}>
          {ts.cancel}
        </AltButton>
        <PriButton
          id="resSave"
          onClick={handleAdd}
          disabled={title === '' || bcp47 === 'und'}
        >
          {mode === Mode.add ? t.add : ts.save}
        </PriButton>
      </ActionRow>
    </Box>
  );
}
