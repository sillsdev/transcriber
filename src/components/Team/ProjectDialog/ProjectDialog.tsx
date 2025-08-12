import React, { useEffect, useMemo, useState } from 'react';
import { ITag, IVProjectStrings } from '../../../model';
import {
  Box,
  Dialog,
  DialogContent,
  Tabs,
  Tab,
  SxProps,
  Stack,
  FormLabel,
} from '@mui/material';
import {
  ProjectName,
  ProjectDescription,
  ProjectType,
  ProjectAdvanced,
  Language,
  ILanguage,
} from '.';
import Mode from '../../../model/dialogMode';
import { IDialog } from '../../../model';
import { shallowEqual, useSelector } from 'react-redux';
import { vProjectSelector } from '../../../selector';
import { ProjectBook } from './ProjectBook';
import { StyledDialogTitle } from '../../StyledDialogTitle';
import { AltActionBar } from '../../../AltActionBar';
import Tags from '../../../control/Tags';

const initState = {
  name: '',
  description: '',
  type: 'scripture',
  book: '',
  story: true,
  bcp47: 'und',
  languageName: '',
  isPublic: false,
  spellCheck: false,
  font: '',
  rtl: false,
  fontSize: 'large',
  tags: {} as ITag,
  flat: false,
  organizedBy: '',
  isPersonal: false,
  vProjectStrings: {} as IVProjectStrings,
  sheetUser: undefined as string | undefined,
  sheetGroup: undefined as string | undefined,
  publishUser: undefined as string | undefined,
  publishGroup: undefined as string | undefined,
};
export const initProjectState = { ...initState };
export type IProjectDialog = typeof initState;

export interface IProjectDialogState {
  state: IProjectDialog;
  setState: React.Dispatch<React.SetStateAction<IProjectDialog>>;
  setBookErr?: React.Dispatch<React.SetStateAction<string>>;
  addMode?: boolean;
  tagCheck?: boolean;
  team?: string;
}

interface IProps extends IDialog<IProjectDialog> {
  nameInUse?: (newName: string) => boolean;
  team?: string;
}

const tabProps = {
  width: '50%',
} as SxProps;

export function ProjectDialog(props: IProps) {
  const { mode, values, isOpen, onOpen, onCommit, onCancel, nameInUse, team } =
    props;
  const t: IVProjectStrings = useSelector(vProjectSelector, shallowEqual);
  initState.organizedBy = 'section';
  initState.vProjectStrings = t;
  const [state, setState] = React.useState({ ...initState });
  const { name, type, bcp47, book } = state;
  const [bookErr, setBookErr] = React.useState('');
  const [basicTab, setBasicTab] = useState(true);
  const addingRef = React.useRef(false);

  const initTags = useMemo(
    () => ({
      [t.testing]: false,
      [t.backtranslation]: false,
      [t.training]: false,
    }),
    [t]
  );

  useEffect(() => {
    setState(!values ? { ...initState } : { ...values });
    if (isOpen) addingRef.current = false;
  }, [values, isOpen]);

  const handleClose = () => {
    if (onOpen) onOpen(false);
    if (onCancel) onCancel();
  };

  const handleAdd = () => {
    if (!addingRef.current) {
      addingRef.current = true;

      if (onOpen) onOpen(false);
      onCommit(state);
    }
  };

  const handleTypeChange = (val: string) => {
    setState((state) => ({ ...state, type: val || '' }));
  };

  const handleLanguageChange = (val: ILanguage) => {
    setState((state) => ({ ...state, ...val }));
  };

  const [value, setValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
    if (newValue === 0) {
      setBasicTab(true);
    } else {
      setBasicTab(false);
    }
  };

  return (
    <Dialog
      id="projectSettings"
      open={isOpen}
      onClose={handleClose}
      aria-labelledby="projectDlg"
      scroll={'paper'}
      disableEnforceFocus
      maxWidth="md"
      fullWidth
    >
      <StyledDialogTitle id="projectDlg">
        {t.newProject.replace('{0}', mode === Mode.add ? t.configure : t.edit)}
      </StyledDialogTitle>
      <Tabs
        value={value}
        onChange={handleTabChange}
        sx={{
          maxWidth: '400px',
          width: '100%',
          '& .MuiTabs-indicator': {
            backgroundColor: 'secondary.dark',
            height: '2px',
          },
          '& .Mui-selected': {
            color: 'secondary.dark',
          },
        }}
      >
        <Tab label={t.basic} sx={tabProps} />
        <Tab label={t.advanced} sx={tabProps} />
      </Tabs>
      {basicTab ? (
        <Box>
          <DialogContent>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: '32px',
              }}
            >
              <ProjectName
                state={state}
                setState={setState}
                inUse={nameInUse}
              />
              <ProjectDescription state={state} setState={setState} />
            </Box>
            <ProjectType type={type} onChange={handleTypeChange} />
            <ProjectBook
              state={state}
              setState={setState}
              setBookErr={setBookErr}
            />
            <Stack sx={{ pt: 1, pb: 2 }}>
              <Language
                {...state}
                onChange={handleLanguageChange}
                direction="row"
                sx={{ pt: 0 }}
              />
            </Stack>
            <FormLabel sx={{ color: 'secondary.light' }}>{t.tags}</FormLabel>
            <Tags
              label={t.newTag}
              tags={
                Object.keys(state?.tags).length > 0 ? state?.tags : initTags
              }
              onChange={(tags) => setState((state) => ({ ...state, tags }))}
            />
          </DialogContent>
        </Box>
      ) : (
        <Box>
          <DialogContent>
            <ProjectAdvanced
              state={state}
              setState={setState}
              addMode={mode === Mode.add}
              team={team}
            />
          </DialogContent>
        </Box>
      )}

      <AltActionBar
        primaryLabel={mode === Mode.add ? t.add : t.save}
        primaryOnClick={handleAdd}
        primaryDisabled={
          (nameInUse && nameInUse(name)) ||
          name === '' ||
          bcp47 === 'und' ||
          type === '' ||
          bookErr !== '' ||
          (type !== 'scripture' && book === '')
        }
        primaryKey={'add'}
        primaryAria={t.add}
        altShown={true}
        altLabel={t.cancel}
        altOnClick={handleClose}
        altKey={'cancel'}
        altAria={t.cancel}
        sx={{
          position: 'sticky',
          bottom: '0px',
          padding: '10px 0px',
          paddingLeft: '10px',
          pointerEvents: 'auto',
          zIndex: '10',
          borderTop: '1px solid lightgray',
          backgroundColor: 'primary.contrastText',
        }}
      />
    </Dialog>
  );
}

export default ProjectDialog;
