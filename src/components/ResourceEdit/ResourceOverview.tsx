import { Box, Divider, Stack } from '@mui/material';
import React, { useEffect, useMemo, useRef } from 'react';
import {
  ActionRow,
  AltButton,
  GrowingDiv,
  ILanguage,
  Language,
  PriButton,
} from '../../control';
import { IDialog, IResourceStrings, ISharedStrings, ISheet } from '../../model';
import { useSelector, shallowEqual } from 'react-redux';
import { sharedResourceSelector, sharedSelector } from '../../selector';
import Mode from '../../model/dialogMode';
import {
  ResourceCategory,
  ResourceDescription,
  ResourceKeywords,
  ResourceTerms,
  ResourceTitle,
  ResourceLink,
} from '.';
import { useGlobal } from 'reactn';
import { useOrgDefaults } from '../../crud';
import { ResKw } from './ResourceKeywords';
import { NoteTitle } from './NoteTitle';

export interface IResourceDialog {
  title: string;
  mediaId: string;
  description: string;
  bcp47: string;
  languageName: string;
  font: string;
  rtl: boolean;
  spellCheck: boolean;
  terms: string;
  keywords: string;
  linkurl: string;
  note: boolean;
  category: string;
  changed: boolean;
  ws: ISheet | undefined;
  onRecording: (isRecording: boolean) => void;
}

export interface IResourceState {
  state: IResourceDialog;
  setState?: React.Dispatch<React.SetStateAction<IResourceDialog>>;
}

interface IProps extends IDialog<IResourceDialog> {
  isNote: boolean;
  ws: ISheet | undefined;
  nameInUse?: (newName: string) => boolean;
  onDelete?: () => void;
}

export default function ResourceOverview(props: IProps) {
  const {
    mode,
    values,
    isOpen,
    isNote,
    ws,
    onOpen,
    onCommit,
    onCancel,
    onDelete,
  } = props;

  const [isDeveloper] = useGlobal('developer');
  const recording = useRef(false);
  const { getOrgDefault, setOrgDefault, canSetOrgDefault } = useOrgDefaults();
  const ts: ISharedStrings = useSelector(sharedSelector, shallowEqual);
  const t: IResourceStrings = useSelector(sharedResourceSelector, shallowEqual);

  const onRecording = (isRecording: boolean) => {
    recording.current = isRecording;
  };

  const initState: IResourceDialog = React.useMemo(
    () => ({
      title: '',
      mediaId: '',
      description: '',
      bcp47: 'und',
      languageName: '',
      font: '',
      rtl: false,
      spellCheck: false,
      terms: '',
      keywords: '',
      linkurl: '',
      note: false,
      category: '',
      changed: false,
      ws: ws,
      onRecording,
    }),
    [ws]
  );

  const [state, setState] = React.useState({ ...initState });
  const { title, bcp47, keywords } = state;

  const updateState = useMemo(
    () => (mode === Mode.view ? undefined : setState),
    [mode]
  );

  useEffect(() => {
    setState(
      !values
        ? { ...initState }
        : { ...values, ws, onRecording, changed: false }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values, isOpen]);

  useEffect(() => {
    setState(
      !values
        ? { ...initState, note: isNote }
        : { ...values, ws, onRecording, note: isNote }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values, isNote]);

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
        {isNote ? (
          <NoteTitle state={state} setState={updateState} />
        ) : (
          <ResourceTitle state={state} setState={updateState} />
        )}
        <ResourceDescription state={state} setState={updateState} />
        <ResourceCategory state={state} setState={updateState} />
        <ResourceKeywords state={state} setState={updateState} />
        {!isNote ? (
          <>
            <ResourceTerms state={state} setState={updateState} />
            <Language
              {...state}
              onChange={handleLanguageChange}
              hideSpelling
              hideFont
              disabled={mode === Mode.view}
            />
          </>
        ) : (
          <ResourceLink state={state} setState={updateState} />
        )}
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
            disabled={
              title === '' ||
              (bcp47 === 'und' && !isNote) ||
              !state.changed ||
              recording.current
            }
          >
            {mode === Mode.add ? t.add : ts.save}
          </PriButton>
        )}
      </ActionRow>
    </Box>
  );
}
