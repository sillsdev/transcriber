import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Bible, ICardsStrings, Organization, ProjectD } from '../model';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  TypographyProps,
  FormGroup,
  Box,
  styled,
  Grid,
  GridProps,
  TextField,
  Link,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InfoIcon from '@mui/icons-material/Info';
import { ILanguage, LightTooltip } from '../control';
import {
  related,
  useOrgDefaults,
  useBible,
  orgDefaultLangProps,
  pubDataCopyright,
  // pubDataNoteLabel,
  pubDataLangProps,
} from '../crud';
import { useBibleMedia } from '../crud/useBibleMedia';
import { useSnackBar } from '../hoc/SnackBar';
import { useOrbitData } from '../hoc/useOrbitData';
import MediaTitle from '../control/MediaTitle';

const GridContainerRow = styled(Grid)<GridProps>(({ theme }) => ({
  display: 'flex',
  flexDirection: 'row',
  flexGrow: 1,
}));

const initLang = {
  bcp47: '',
  languageName: '',
  font: '',
  rtl: false,
  spellCheck: false,
};

const Heading = styled(Typography)<TypographyProps>(({ theme }) => ({
  fontSize: theme.typography.pxToRem(15),
  fontWeight: theme.typography.fontWeightRegular,
}));

interface IProps {
  t: ICardsStrings;
  team?: Organization;
  bible?: Bible;
  readonly?: boolean;
  setValue: (what: string, value: string, init?: boolean) => void;
  onChanged: (changed: boolean) => void;
  onRecording: (recording: boolean) => void;
  // setCanSave: (canSave: boolean) => void;
  bibles: Array<Bible>;
}

export function PublishExpansion(props: IProps) {
  const { t, team, bible, readonly, setValue, onChanged, onRecording, bibles } =
    props;
  const projects = useOrbitData<ProjectD[]>('project');
  const [isoMediafile, setIsoMediafilex] = useState('');
  const [bibleMediafile, setBibleMediafilex] = useState('');
  const [bibleId, setBibleId] = useState('');
  const [bibleIdError, setBibleIdErrorx] = useState('');
  const [bibleName, setBibleName] = useState('');
  const [description, setDescription] = useState('');
  const [copyright, setCopyright] = useState('');
  // const [noteLabel, setNoteLabel] = useState('');
  const { getDefault } = useOrgDefaults();
  const [language, setLanguagex] = React.useState<ILanguage>(initLang);
  const languageRef = useRef<ILanguage>(initLang);
  const { getPublishingData } = useBible();
  const { getBibleMediaPlan } = useBibleMedia();
  const [mediaplan, setMediaplan] = useState('');
  const { showMessage } = useSnackBar();

  const setLanguage = (language: ILanguage, init?: boolean) => {
    languageRef.current = language;
    setLanguagex(language);
    if (
      init &&
      !bible?.attributes?.iso &&
      language?.bcp47 &&
      language?.bcp47 !== 'und'
    ) {
      setValue('iso', language?.bcp47, init);
      setValue('languageName', language?.languageName, init);
      setValue(pubDataLangProps, JSON.stringify(language), init);
    }
    if (!init) {
      setValue('iso', language?.bcp47 ?? '');
      setValue('languageName', language?.languageName ?? '');
      setValue(pubDataLangProps, JSON.stringify(language), init);
    }
  };
  useEffect(() => {
    getBibleMediaPlan().then((plan) => {
      setMediaplan(plan.id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (bible) {
      setBibleId(bible.attributes?.bibleId);
      setBibleName(bible.attributes?.bibleName);
      setDescription(bible.attributes?.description);
      setIsoMediafilex(related(bible, 'isoMediafile') as string);
      setBibleMediafilex(related(bible, 'bibleMediafile') as string);
    }
    var lang = getPublishingData(pubDataLangProps, bible);
    if (!lang)
      lang = team
        ? (getDefault(orgDefaultLangProps, team) as typeof initLang) ?? initLang
        : initLang;

    setLanguage(lang, true);
    setCopyright(getPublishingData(pubDataCopyright, bible) as string);
    // setNoteLabel(getPublishingData(pubDataNoteLabel, bible) as string);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [team, bible]);

  const setBibleIdError = (error: string) => {
    setBibleIdErrorx(error);
    setValue('bibleIdError', error);
  };
  const setBibleMediafile = (mediaId: string) => {
    setBibleMediafilex(mediaId);
    setValue('bibleMediafile', mediaId);
  };
  const setIsoMediafile = (mediaId: string) => {
    setIsoMediafilex(mediaId);
    setValue('isoMediafile', mediaId);
  };
  const handleChangeBibleId = (event: any) => {
    const newId = (event.target.value as string).toLocaleUpperCase();
    setBibleIdError(bibleIdIsValid(newId));
    setBibleId(newId);
    if (bible?.attributes?.bibleId !== newId) setValue('bibleId', newId);
    return '';
  };
  const handleChangeBibleName = (value: string) => {
    setBibleName(value);
    if (bible?.attributes?.bibleName !== value) setValue('bibleName', value);
    return '';
  };
  const handleChangeDescription = (event: any) => {
    const value = event.target.value as string;
    setDescription(value);
    if (bible?.attributes?.description !== value)
      setValue('description', value);
    return '';
  };
  const handleChangeCopyright = (event: any) => {
    const value = event.target.value as string;
    setCopyright(value);
    setValue(pubDataCopyright, value);
    return '';
  };
  // const handleChangeNoteLabel = (event: any) => {
  //   const value = event.target.value as string;
  //   setNoteLabel(value);
  //   setValue(pubDataNoteLabel, value);
  //   return '';
  // };

  const onMyRecording = (recording: boolean) => {
    if (recording) {
      onChanged(true);
    }
    onRecording && onRecording(recording);
  };
  const handleLanguageChange = useCallback(
    (lang: ILanguage) => {
      setLanguage(lang);
      onChanged(true);
      if (bibleId) setBibleIdError(bibleIdIsValid(bibleId));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [bibleId]
  );

  const bibleIdIsValid = (newName: string): string => {
    if (!newName) return '';
    if (!/^[A-Z]{6}/.test(newName) || newName.length < 6)
      return t.bibleidformat;
    let iso639_3 = languageRef.current?.info?.iso639_3;
    if (!iso639_3) {
      const bcp47lg = languageRef.current?.bcp47.split('-')[0];
      if (bcp47lg.length === 3) iso639_3 = bcp47lg;
    }
    if (iso639_3 && newName.indexOf(iso639_3.toLocaleUpperCase()) !== 0)
      return t.bibleidiso;
    if (newName === bible?.attributes?.bibleId) return '';
    //TODO: check bible brain also
    const sameNameRec = bibles.filter(
      (o) => o?.attributes?.bibleId === newName
    );
    return sameNameRec.length === 0 ? '' : t.bibleidexists;
  };

  const handleCanRecord = useCallback(() => {
    const canRecord = projects.some(
      (p) => related(p, 'organization') === team?.id
    );
    if (!canRecord) showMessage(t.projectRequired);
    return canRecord;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects, team]);

  return (
    <Box sx={{ width: '100%', my: 1 }}>
      <Accordion>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel1a-content"
          id="panel1a-header"
        >
          <Heading>{t.publishing}</Heading>
        </AccordionSummary>
        <AccordionDetails sx={{ display: 'flex', flexDirection: 'column' }}>
          <FormGroup
            sx={{
              display: 'flex',
              flexDirection: 'row',
              flexGrow: 1,
              padding: '20px',
              border: '1px solid',
              borderColor: 'secondary.main',
            }}
          >
            <GridContainerRow item>
              <TextField
                id="bibleid"
                label={t.bibleid}
                value={bibleId ?? ''}
                onChange={handleChangeBibleId}
                variant="outlined"
                helperText={bibleIdError}
                error={bibleIdError !== ''}
                sx={{ width: '100%' }}
                required
              />
              <LightTooltip title={t.bibleIdExplain}>
                <Link
                  href="https://www.faithcomesbyhearing.com/bible-brain/core-concepts"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <InfoIcon
                    sx={{ fontSize: 'small', color: 'text.secondary' }}
                  />
                </Link>
              </LightTooltip>
            </GridContainerRow>
            <div>
              <MediaTitle
                titlekey={'iso-'}
                language={language}
                label={t.language.replace(': {0}', '')}
                mediaId={isoMediafile}
                title={''}
                defaultFilename={(team?.attributes?.slug ?? '') + 'iso'}
                onLangChange={handleLanguageChange}
                canRecord={handleCanRecord}
                onRecording={onMyRecording}
                useplan={mediaplan}
                onMediaIdChange={(mediaId: string) => setIsoMediafile(mediaId)}
                disabled={readonly}
              />
              <MediaTitle
                titlekey={'bibleName-'}
                label={t.biblename}
                mediaId={bibleMediafile}
                title={bibleName}
                defaultFilename={(team?.attributes?.slug ?? '') + 'bible'}
                onTextChange={handleChangeBibleName}
                canRecord={handleCanRecord}
                onRecording={onMyRecording}
                useplan={mediaplan}
                onMediaIdChange={(mediaId: string) =>
                  setBibleMediafile(mediaId)
                }
                disabled={readonly}
              />
            </div>
            <TextField
              id="description"
              label={t.description}
              value={description ?? ''}
              onChange={handleChangeDescription}
              variant="outlined"
              sx={{ width: '100%', marginTop: '5px' }}
              disabled={readonly}
            />
            <TextField
              id="copyright"
              label={t.copyright}
              value={copyright ?? ''}
              onChange={handleChangeCopyright}
              variant="outlined"
              sx={{ width: '100%', marginTop: '8px' }}
              disabled={readonly}
            />
            {/* <TextField
              id="notelabel"
              label={t.notesLabel}
              value={noteLabel ?? ''}
              onChange={handleChangeNoteLabel}
              variant="outlined"
              sx={{ width: '100%', marginTop: '8px' }}
            /> */}
          </FormGroup>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}

export default PublishExpansion;
