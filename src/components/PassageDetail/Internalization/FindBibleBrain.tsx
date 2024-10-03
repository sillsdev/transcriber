import {
  Autocomplete,
  Checkbox,
  Divider,
  FormControl,
  FormControlLabel,
  FormLabel,
  Grid,
  Radio,
  RadioGroup,
  Stack,
  TextField,
} from '@mui/material';
import { SyntheticEvent, useContext, useEffect, useState } from 'react';
import { OptionProps, scopeI } from './FindTabs';
import { shallowEqual, useSelector } from 'react-redux';
import { findResourceSelector } from '../../../selector';
import { IFindResourceStrings } from '../../../model';
import { BibleBrainItem } from '../../../model/bible-brain-item';
import { useBookN } from '../../../utils';
import usePassageDetailContext from '../../../context/usePassageDetailContext';
import { ActionRow, AltButton, PriButton } from '../../StepEditor';
import { useOrganizedBy } from '../../../crud/useOrganizedBy';
import { TokenContext } from '../../../context/TokenProvider';
import VwBiblebrainlanguage from '../../../model/vwbiblebrainlanguage';
import JSONAPISource from '@orbit/jsonapi';
import { useGlobal } from 'reactn';
import { useBibleBrain } from '../../../crud/useBibleBrain';

interface FindBibleBrainProps {
  handleLink: (
    kind: string
  ) => (_event: SyntheticEvent, newValue: OptionProps | null) => void;
}

export default function FindBibleBrain({ handleLink }: FindBibleBrainProps) {
  const [data, setData] = useState<BibleBrainItem[]>([]);
  const [options, setOptions] = useState<OptionProps[]>([]);
  const [Nt, setNt] = useState<boolean>(true);
  const [languages, setLanguages] = useState<VwBiblebrainlanguage[]>([]);
  const [langOpts, setLangOpts] = useState<OptionProps[]>([]);
  const [lang, setLang] = useState<OptionProps | null>(null);
  const [timing, setTiming] = useState<boolean>(true);
  const [bibleOpt, setBibleOpt] = useState<OptionProps | null>(null);
  const [createPassages, setCreatePassages] = useState<boolean>(false);
  const [createSections, setCreateSections] = useState<boolean>(false);
  const [creationScope, setCreationScope] = useState<scopeI>(scopeI.passage);
  const [limit, setLimit] = useState(100);
  const [offset, setOffset] = useState(0);
  const { passage } = usePassageDetailContext();
  const { getOrganizedBy } = useOrganizedBy();
  const [organizedBy] = useState(getOrganizedBy(true));
  const bookN = useBookN();
  const token = useContext(TokenContext).state.accessToken ?? '';
  const t: IFindResourceStrings = useSelector(
    findResourceSelector,
    shallowEqual
  );
  const { getLanguages, getBibles } = useBibleBrain();

  const scopeOptions = [t.passage, organizedBy, t.chapter, t.book];

  useEffect(() => {
    // console.log(languages);
    const langOptions = languages.map((item: BibleBrainLanguage) => ({
      value: item.iso,
      label: `${item.name ?? item.autonym} (${item.iso})`,
    }));
    setLangOpts(langOptions);
    setLang(langOptions.find((o) => o.value === 'eng') ?? null);
  }, [languages]);

  useEffect(() => {
    if (lang === null) return;
    const paramArr = [
      ['lang', lang?.value || 'eng'],
      ['limit', limit.toString()],
      ['offset', offset.toString()],
    ];
    const searchParams = new URLSearchParams(paramArr);

    axiosGet('biblebrain/bibles', searchParams, token).then((response) => {
      console.log(response);
      //setCount(response.meta.total);
      //setResult(response.data.items);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, limit, offset]);

  useEffect(() => {}, [lang]);

  const itemOpt = (item: BibleBrainItem) => ({
    label: `${item.lang_name} (${item.iso}) - [${item.bible_id}] ${item.bible_name}`,
    value: item.bible_id,
  });

  useEffect(() => {
    const isNt = bookN(passage?.attributes?.book || 'MAT') > 39;
    setNt(isNt);
    getLanguages(isNt, timing).then((langs) => setLanguages(langs));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timing, data, passage]);

  useEffect(() => {}, [iso]);
  return (
    <Grid
      container
      spacing={2}
      direction="row"
      sx={{ justifyContent: 'center', mb: '150px' }}
    >
      <Grid item>
        <Autocomplete
          disablePortal
          id="bb-lang"
          options={langOpts}
          value={lang}
          onChange={(_event, value) => setLang(value)}
          sx={{ width: 300 }}
          renderInput={(params) => (
            <TextField {...params} label={t.aquiferLang} />
          )}
        />
      </Grid>
      <Grid item>
        <Stack sx={{ m: 1 }} spacing={2}>
          <FormControlLabel
            control={
              <Checkbox
                checked={timing}
                onChange={(_e, checked) => setTiming(checked)}
              />
            }
            label={t.withTiming}
          />
          <Autocomplete
            disablePortal
            id="bible-brain-resource"
            options={options}
            value={bibleOpt && options.includes(bibleOpt) ? bibleOpt : null}
            onChange={(_e, opt) => setBibleOpt(opt ?? null)}
            sx={{ width: 300 }}
            renderInput={(params) => (
              <TextField
                {...params}
                label={t.bibleBrain.replace('{0}', 'Bible Brain') + '*'}
              />
            )}
          />
        </Stack>
      </Grid>
      <Grid item>
        <FormControl
          component="fieldset"
          sx={{ border: '1px solid grey', mr: 1, px: 2 }}
        >
          <FormLabel component="legend">{t.createItems}</FormLabel>
          <FormControlLabel
            control={
              <Checkbox
                checked={createPassages}
                onChange={(_e, checked) => setCreatePassages(checked)}
              />
            }
            label={t.bibleBrain.replace('{0}', t.passage)}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={createSections}
                onChange={(_e, checked) => setCreateSections(checked)}
              />
            }
            label={t.bibleBrain.replace('{0}', organizedBy)}
          />
        </FormControl>
        <FormControl
          component="fieldset"
          sx={{ border: '1px solid grey', mr: 1, px: 2 }}
        >
          <FormLabel component="legend">{t.scope}</FormLabel>
          <RadioGroup
            aria-labelledby="creation-scope-radio-buttons-label"
            value={(creationScope ?? scopeI.passage).toString()}
            onChange={(_e, value) =>
              setCreationScope(parseInt(value) as scopeI)
            }
            name="creation-scope-radio-buttons"
          >
            {scopeOptions.map((o, i) => (
              <FormControlLabel
                key={o}
                value={i as scopeI}
                control={<Radio />}
                label={o}
              />
            ))}
          </RadioGroup>
        </FormControl>
      </Grid>
      <Grid container direction={'row'} spacing={2} sx={{ my: 1 }}>
        <Divider sx={{ width: '100%' }} />
        <ActionRow>
          <AltButton
            disabled={!bibleOpt}
            onClick={(e) => handleLink('bibleBrain')(e, bibleOpt)}
          >
            {t.launch}
          </AltButton>
          <PriButton
            disabled={
              !bibleOpt ||
              !timing ||
              (!createPassages && !createSections) ||
              (creationScope === scopeI.passage && createSections)
            }
            onClick={() =>
              console.log(
                `Use ${bibleOpt?.value} to create: ${
                  createPassages ? 'passages' : ''
                } ${createSections ? 'sections' : ''} For current: ${
                  scopeOptions[creationScope]
                }`
              )
            }
          >
            {t.create}
          </PriButton>
        </ActionRow>
      </Grid>
    </Grid>
  );
}
