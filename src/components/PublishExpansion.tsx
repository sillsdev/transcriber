import React, { useEffect, useRef, useState } from 'react';
import { ICardsStrings, Organization } from '../model';
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
import { related, useOrgDefaults } from '../crud';
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
  spellCheck: false,
};

const Heading = styled(Typography)<TypographyProps>(({ theme }) => ({
  fontSize: theme.typography.pxToRem(15),
  fontWeight: theme.typography.fontWeightRegular,
}));

interface IProps {
  t: ICardsStrings;
  team?: Organization;
  setValue: (what: string, value: string) => void;
  onChanged: (changed: boolean) => void;
  // setCanSave: (canSave: boolean) => void;
  organizations: Array<Organization>;
  teamplan: string | undefined;
}

export function PublishExpansion(props: IProps) {
  const { t, team, teamplan, setValue, onChanged, organizations } = props;
  const [isoMediafile, setIsoMediafilex] = useState('');
  const [bibleMediafile, setBibleMediafilex] = useState('');
  const [bibleId, setBibleId] = useState('');
  const [bibleName, setBibleName] = useState('');
  //TOOD const [publishingData, setPublishingData] = useState('{}');
  const { getDefault, setDefault } = useOrgDefaults();
  const [language, setLanguagex] = React.useState<ILanguage>(initLang);
  const languageRef = useRef<ILanguage>(initLang);

  const setLanguage = (language: ILanguage, init?: boolean) => {
    languageRef.current = language;
    setLanguagex(language);
    if (
      init &&
      !team?.attributes?.iso &&
      language?.bcp47 &&
      language?.bcp47 !== 'und'
    ) {
      setValue('iso', language?.bcp47);
      setValue('languageName', language?.languageName);
    }
    if (!init) {
      var t = team ?? ({ attributes: { defaultParams: '{}' } } as Organization);
      setDefault('langProps', language, t);
      setValue('defaultParams', t.attributes.defaultParams ?? '{}');
      setValue('iso', language?.bcp47);
      setValue('languageName', language?.languageName);
    }
  };

  useEffect(() => {
    if (team) {
      setBibleId(team.attributes?.bibleId);
      setBibleName(team.attributes?.bibleName);
      //TODO setPublishingData(team.attributes?.publishingData || '{}');
      setIsoMediafilex(related(team, 'isoMediafile') as string);
      setBibleMediafilex(related(team, 'bibleMediafile') as string);
    }
    const language = team
      ? (getDefault('langProps', team) as typeof initLang)
      : initLang;

    console.log('useEffect', language);
    setLanguage(language, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [team]);

  const setBibleMediafile = (mediaId: string) => {
    setBibleMediafilex(mediaId);
    setValue('bibleMediafile', mediaId);
  };
  const setIsoMediafile = (mediaId: string) => {
    setIsoMediafilex(mediaId);
    setValue('isoMediafile', mediaId);
  };
  const handleChangeBibleId = (event: any) => {
    if (!bibleIdIsValid(event.target.value)) {
      return t.bibleidexists;
    }
    setBibleId(event.target.value);
    if (team?.attributes?.bibleId !== event.target.value)
      setValue('bibleId', event.target.value);
    return '';
  };
  const handleChangeBibleName = (value: string) => {
    setBibleName(value);
    if (team?.attributes?.bibleName !== value) setValue('bibleName', value);
    return '';
  };
  const onRecording = (recording: boolean) => {
    if (recording) {
      onChanged(true);
    }
  };
  const handleLanguageChange = (lang: ILanguage) => {
    setLanguage(lang);
    onChanged(true);
  };

  //TODO
  /*
  const handleChangePublishingData = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    e.persist();
    setValue('publishingData', e.target.value);
    setPublishingData(e.target.value);
  };
  */
  const bibleIdIsValid = (newName: string): boolean => {
    if (newName === team?.attributes?.bibleId) return true;
    //TODO: Is there a format?
    //TODO: check bible brain also
    const sameNameRec = organizations.filter(
      (o) => o?.attributes?.bibleId === newName
    );
    return sameNameRec.length === 0;
  };

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
            <div>
              <MediaTitle
                titlekey={'iso-'}
                language={language}
                label={t.language.replace(': {0}', '')}
                mediaId={isoMediafile}
                title={''}
                defaultFilename={(team?.attributes?.slug ?? '') + 'iso'}
                onLangChange={handleLanguageChange}
                onRecording={onRecording}
                useplan={teamplan}
                onMediaIdChange={(mediaId: string) => setIsoMediafile(mediaId)}
              />

              <MediaTitle
                titlekey={'bibleName-'}
                label={t.biblename}
                mediaId={bibleMediafile}
                title={bibleName}
                defaultFilename={(team?.attributes?.slug ?? '') + 'bible'}
                onTextChange={handleChangeBibleName}
                onRecording={onRecording}
                useplan={teamplan}
                onMediaIdChange={(mediaId: string) =>
                  setBibleMediafile(mediaId)
                }
              />
              <GridContainerRow item>
                <TextField
                  id="bibleid"
                  label={t.bibleid}
                  value={bibleId}
                  onChange={handleChangeBibleId}
                  variant="outlined"
                  sx={{ width: '100%' }}
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
            </div>
          </FormGroup>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}

export default PublishExpansion;
