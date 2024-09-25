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
import { SyntheticEvent, useEffect, useState } from 'react';
import { OptionProps, scopeI } from './FindTabs';
import { shallowEqual, useSelector } from 'react-redux';
import { findResourceSelector } from '../../../selector';
import { IFindResourceStrings } from '../../../model';
import { BibleBrainItem } from '../../../model/bible-brain-item';
import { useBookN } from '../../../utils';
import usePassageDetailContext from '../../../context/usePassageDetailContext';
import { ActionRow, AltButton, PriButton } from '../../StepEditor';
import { useOrganizedBy } from '../../../crud/useOrganizedBy';

interface FindBibleBrainProps {
  handleLink: (
    kind: string
  ) => (_event: SyntheticEvent, newValue: OptionProps | null) => void;
}

export default function FindBibleBrain({ handleLink }: FindBibleBrainProps) {
  const [data, setData] = useState<BibleBrainItem[]>([]);
  const [options, setOptions] = useState<OptionProps[]>([]);
  const [timing, setTiming] = useState<boolean>(true);
  const [bibleOpt, setBibleOpt] = useState<OptionProps | null>(null);
  const [createPassages, setCreatePassages] = useState<boolean>(false);
  const [createSections, setCreateSections] = useState<boolean>(false);
  const [creationScope, setCreationScope] = useState<scopeI>(scopeI.passage);
  const { passage } = usePassageDetailContext();
  const { getOrganizedBy } = useOrganizedBy();
  const [organizedBy] = useState(getOrganizedBy(true));
  const bookN = useBookN();
  const t: IFindResourceStrings = useSelector(
    findResourceSelector,
    shallowEqual
  );

  const scopeOptions = [t.passage, organizedBy, t.chapter, t.book];

  useEffect(() => {
    import('../../../assets/biblebrain_2024-08-22.js').then((module) => {
      setData(
        module.default
          .filter((item) => item?.lang_name)
          .sort(
            (a: BibleBrainItem, b: BibleBrainItem) =>
              a?.lang_name?.localeCompare(b?.lang_name) ||
              a?.iso?.localeCompare(b?.iso) ||
              -1
          )
      );
    });
  }, []);

  const itemOpt = (item: BibleBrainItem) => ({
    label: `${item.lang_name} (${item.iso}) - [${item.bible_id}] ${item.bible_name}`,
    value: item.bible_id,
  });

  useEffect(() => {
    if (timing) {
      const isNt = bookN(passage?.attributes?.book || 'MAT') > 39;
      setOptions(
        data
          .filter((item: BibleBrainItem) => {
            return isNt ? item.nt_timing === 'true' : item.ot_timing === 'true';
          })
          .map((item: BibleBrainItem) => itemOpt(item))
      );
    } else {
      setOptions(data.map((item: BibleBrainItem) => itemOpt(item)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timing, data, passage]);

  return (
    <Grid
      container
      spacing={2}
      direction="row"
      sx={{ justifyContent: 'center', mb: '150px' }}
    >
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
          <AltButton onClick={(e) => handleLink('bibleBrain')(e, bibleOpt)}>
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
