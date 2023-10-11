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
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { ILanguage } from '../control';
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
    }
    if (!init) {
      var t = team ?? ({ attributes: { defaultParams: '{}' } } as Organization);
      setDefault('langProps', language, t);
      setValue('defaultParams', t.attributes.defaultParams ?? '{}');
      setValue('iso', language?.bcp47);
    }
  };

  useEffect(() => {
    if (team) {
      setBibleId(team.attributes?.bibleId);
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
  const handleChangeBibleId = (value: string) => {
    if (!bibleIdIsValid(value)) {
      return t.bibleidexists;
    }
    setBibleId(value);
    if (team?.attributes?.bibleId !== value) setValue('bibleId', value);
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
                title={language?.bcp47}
                defaultFilename={(team?.attributes?.slug ?? '') + 'iso'}
                onLangChange={handleLanguageChange}
                onRecording={onRecording}
                useplan={teamplan}
                onMediaIdChange={(mediaId: string) => setIsoMediafile(mediaId)}
              />
              <GridContainerRow item></GridContainerRow>
              <MediaTitle
                titlekey={'bibleId-'}
                label={t.bibleid}
                mediaId={bibleMediafile}
                title={bibleId}
                defaultFilename={(team?.attributes?.slug ?? '') + 'bible'}
                onTextChange={handleChangeBibleId}
                onRecording={onRecording}
                useplan={teamplan}
                onMediaIdChange={(mediaId: string) =>
                  setBibleMediafile(mediaId)
                }
              />
            </div>
          </FormGroup>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}

export default PublishExpansion;
