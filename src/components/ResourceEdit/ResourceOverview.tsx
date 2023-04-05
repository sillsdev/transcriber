import { Box, Divider, Stack } from '@mui/material';
import React, { useEffect, useMemo } from 'react';
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
import { useOrgDefaults } from '../../crud';
import { ResKw } from './ResourceKeywords';

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
  changed: boolean;
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
  changed: false,
};

export interface IResourceState {
  state: IResourceDialog;
  setState?: React.Dispatch<React.SetStateAction<IResourceDialog>>;
}

interface IProps extends IDialog<IResourceDialog> {
  nameInUse?: (newName: string) => boolean;
  onDelete?: () => void;
}

export default function ResourceOverview(props: IProps) {
  const { mode, values, isOpen, onOpen, onCommit, onCancel, onDelete } = props;

  const [isDeveloper] = useGlobal('developer');
  const [state, setState] = React.useState({ ...initState });
  const { title, bcp47, keywords } = state;
  const { getOrgDefault, setOrgDefault, canSetOrgDefault } = useOrgDefaults();
  const ts: ISharedStrings = useSelector(sharedSelector, shallowEqual);
  const t: IResourceStrings = useSelector(sharedResourceSelector, shallowEqual);

  const updateState = useMemo(
    () => (mode === Mode.view ? undefined : setState),
    [mode]
  );

  useEffect(() => {
    setState(!values ? { ...initState } : { ...values, changed: false });
  }, [values, isOpen]);

  const handleClose = () => {
    if (onOpen) onOpen(false);
    if (onCancel) onCancel();
  };

  const handleAdd = () => {
    onCommit(state);
  };

  const handleLanguageChange = (val: ILanguage) => {
    if (mode !== Mode.view)
      setState((state) => ({ ...state, ...val, changed: true }));
  };

  const handleDelete = () => {
    onDelete && onDelete();
  };

  React.useEffect(() => {
    if (canSetOrgDefault) {
      const allKw = getOrgDefault(ResKw) as string | undefined;
      if (allKw || keywords) {
        const allList = allKw ? allKw?.split('|') : [];
        const kwList = keywords ? keywords.split('|') : [];
        const allSet = new Set(allList.concat(kwList));
        const newList = Array.from(allSet).sort().join('|');
        if (newList !== allKw) setOrgDefault(ResKw, newList);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keywords, canSetOrgDefault]);

  return (
    <Box>
      <Stack spacing={2}>
        <ResourceTitle state={state} setState={updateState} />
        <ResourceDescription state={state} setState={updateState} />
        <ResourceCategory state={state} setState={updateState} />
        <ResourceKeywords state={state} setState={updateState} />
        <ResourceTerms state={state} setState={updateState} />
        <Language
          {...state}
          onChange={handleLanguageChange}
          hideSpelling
          hideFont
          disabled={mode === Mode.view}
        />
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
        {mode !== Mode.view && (
          <PriButton
            id="resSave"
            onClick={handleAdd}
            disabled={title === '' || bcp47 === 'und' || !state.changed}
          >
            {mode === Mode.add ? t.add : ts.save}
          </PriButton>
        )}
      </ActionRow>
    </Box>
  );
}
