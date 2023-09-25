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
  TextField,
  Grid,
  GridProps,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { ILanguage, Language } from '../control';
import { related, useOrgDefaults } from '../crud';
import MediaTitle from '../control/MediaTitle';
import MediaTitleActions from '../control/MediaTitleActions';

const GridContainerRow = styled(Grid)<GridProps>(({ theme }) => ({
  display: 'flex',
  flexDirection: 'row',
  flexGrow: 1,
}));

const initLang = {
  bcp47: 'und',
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
  team: Organization;
  setValue: (what: string, value: string) => void;
  organizations: Array<Organization>;
}

export function PublishExpansion(props: IProps) {
  const { t, team, setValue, organizations } = props;
  const [isoMediafile, setIsoMediafilex] = useState('');
  const [titleMediafile, setTitleMediafilex] = useState('');
  const [bibleId, setBibleId] = useState('');
  const [publishingData, setPublishingData] = useState('');
  const { getDefault, setDefault } = useOrgDefaults();
  const [language, setLanguagex] = React.useState<ILanguage>(initLang);
  const languageRef = useRef<ILanguage>(initLang);

  const setLanguage = (language: ILanguage, init?: boolean) => {
    languageRef.current = language;
    setLanguagex(language);
    console.log('setLanguage', language, init);
    if (init && !team.attributes?.iso && language.bcp47 !== 'und') {
      setValue('iso', language.bcp47);
    }
    if (!init) {
      setDefault('langProps', language, team);
      setValue('defaultParams', team.attributes.defaultParams);
      setValue('iso', language.bcp47);
    }
  };

  useEffect(() => {
    setBibleId(team.attributes.bibleId);
    setPublishingData(team.attributes.publishingData || '{}');
    setIsoMediafilex(related(team, 'isoMediafile') as string);
    setTitleMediafilex(related(team, 'titleMediafile') as string);
    const language = getDefault('langProps', team) as typeof initLang;
    setLanguage(language ?? initLang, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [team]);
  const setTitleMediafile = (mediaId: string) => {
    setTitleMediafilex(mediaId);
    setValue('titleMediafile', mediaId);
  };
  const setIsoMediafile = (mediaId: string) => {
    setIsoMediafilex(mediaId);
    setValue('isoMediafile', mediaId);
  };
  const handleChangeBibleId = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.persist();
    setBibleId(e.target.value);
    if (team.attributes.bibleId !== e.target.value)
      setValue('bibleId', e.target.value);
  };
  const onChanged = (changed: boolean) => {
    //tell someone!
  };
  const handleLanguageChange = (lang: ILanguage) => {
    setLanguage(lang);
  };
  const handleChangePublishingData = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    e.persist();
    setValue('publishingData', e.target.value);
    setPublishingData(e.target.value);
  };
  const bibleIdInUse = (newName: string): boolean => {
    if (newName === team.attributes.bibleId) return false;
    const sameNameRec = organizations.filter(
      (o) => o?.attributes?.bibleId === bibleId
    );
    return sameNameRec.length > 0;
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Accordion onChange={() => console.log('according change')}>
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
              <GridContainerRow item>
                <Language
                  {...language}
                  hideFont
                  hideSpelling
                  onChange={handleLanguageChange}
                />
                <MediaTitleActions
                  mediaId={titleMediafile}
                  defaultFilename={team.attributes.slug + 'title'}
                  setMediaId={setTitleMediafile}
                />
                <MediaTitle
                  row={{ mediaId: isoMediafile, title: language.bcp47 }}
                  defaultFilename={team.attributes.slug + 'iso'}
                  onChanged={onChanged}
                  onRecording={(recording: boolean) => {}}
                  afterUploadCb={async (mediaId) => {
                    console.log('new mediaid', mediaId);
                    setTitleMediafile(mediaId);
                  }}
                />
              </GridContainerRow>
              <GridContainerRow item>
                <TextField
                  autoFocus
                  margin="dense"
                  id="bibleid"
                  label={t.bibleid}
                  value={bibleId}
                  helperText={
                    bibleId && bibleIdInUse(bibleId) && t.bibleidexists
                  }
                  onChange={handleChangeBibleId}
                  fullWidth
                />
                <MediaTitle
                  row={{ mediaId: titleMediafile, title: bibleId }}
                  defaultFilename={team.attributes.slug + 'title'}
                  onChanged={() => {}}
                  onRecording={() => {}}
                  afterUploadCb={async (mediaId) => {
                    console.log('new mediaid', mediaId);
                    setIsoMediafile(mediaId);
                  }}
                />
              </GridContainerRow>
            </div>
          </FormGroup>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}

export default PublishExpansion;
