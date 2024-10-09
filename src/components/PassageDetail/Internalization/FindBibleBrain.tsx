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
  Typography,
} from '@mui/material';
import { SyntheticEvent, useContext, useEffect, useRef, useState } from 'react';
import { OptionProps, scopeI } from './FindTabs';
import { shallowEqual, useSelector } from 'react-redux';
import { findResourceSelector } from '../../../selector';
import { IFindResourceStrings } from '../../../model';
import { useBookN, useDataChanges, useWaitForRemoteQueue } from '../../../utils';
import usePassageDetailContext from '../../../context/usePassageDetailContext';
import { ActionRow, AltButton, PriButton } from '../../StepEditor';
import { useOrganizedBy } from '../../../crud/useOrganizedBy';
import { TokenContext } from '../../../context/TokenProvider';
import VwBiblebrainlanguage from '../../../model/vwbiblebrainlanguage';
import { useBibleBrain } from '../../../crud/useBibleBrain';
import VwBiblebrainbible from '../../../model/vwbiblebrainbible';
import { axiosGet, axiosPost } from '../../../utils/axios';
import { useSecResCreate } from '../../../crud/useSecResCreate';
import remoteIdNum from '../../../crud/remoteId';
import { useGlobal } from 'reactn';
import { RecordKeyMap } from '@orbit/records';

interface FindBibleBrainProps {
  onClose?: () => void;
  handleLink: (
    kind: string
  ) => (_event: SyntheticEvent, newValue: OptionProps | null) => void;
}

export default function FindBibleBrain({ handleLink, onClose }: FindBibleBrainProps) {
  const forceDataChanges = useDataChanges();
  const waitForRemoteQueue = useWaitForRemoteQueue();
  const [memory] = useGlobal('memory');
  const [options, setOptions] = useState<OptionProps[]>([]);
  const [Nt, setNt] = useState<boolean>(true);
  const [languages, setLanguages] = useState<VwBiblebrainlanguage[]>([]);
  const [bibles, setBibles] = useState<VwBiblebrainbible[]>([]);
  const [langOpts, setLangOpts] = useState<OptionProps[]>([]);
  const [lang, setLang] = useState<OptionProps | null>(null);
  const [timing, setTiming] = useState<boolean>(true);
  const [bibleOpt, setBibleOpt] = useState<OptionProps | null>(null);
  const [copyright, setCopyright] = useState('');
  const [createPassages, setCreatePassages] = useState<boolean>(true);
  const [createSections, setCreateSectionsx] = useState<boolean>(true);
  const [creationScope, setCreationScope] = useState<scopeI>(scopeI.section);
  const { passage, section } = usePassageDetailContext();
  const { getOrganizedBy } = useOrganizedBy();
  const [organizedBy] = useState(getOrganizedBy(true));
  const [adding, setAddingx] = useState(false);
  const addingRef = useRef(false);
  const { InternalizationStep } = useSecResCreate(section);
  const [queryLang, setQueryLang] = useState(true);
  const [queryBible, setQueryBible] = useState(true);
  const bookN = useBookN();
  const token = useContext(TokenContext).state.accessToken ?? '';
  const t: IFindResourceStrings = useSelector(
    findResourceSelector,
    shallowEqual
  );
  const { getLanguages, getBibles } = useBibleBrain();

  const scopeOptions = [t.passage, organizedBy, t.chapter, t.book];

  const setAdding = (adding: boolean) => {
    setAddingx(adding);
    addingRef.current = adding;
  }
  const setCreateSections = (createsections: boolean) => {
    setCreateSectionsx(createsections);
    if (createsections && creationScope === scopeI.passage)
      setCreationScope(scopeI.section)
  }
  useEffect(() => {
    // console.log(languages);
    const langOptions = languages.map((item: VwBiblebrainlanguage) => ({
      value: item.attributes.iso,
      label: `${item.attributes.languageName} (${item.attributes.iso})`,
    }));
    setLangOpts(langOptions);
    setQueryLang(false);
    setLang(langOptions.find((o) => o.value === 'eng') ?? null);
  }, [languages]);

  useEffect(() => {
    setBibleOpt(null);
    if (lang === null) return;
    var l = languages.find(v => v.attributes.iso === lang.value);
    if (l) {
      setQueryBible(true);
      getBibles(lang.value, l.attributes.languageName, Nt, timing).then((bibles) => {
        setBibles(bibles);
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  useEffect(() => {
    const bibleOptions = bibles.map((item: VwBiblebrainbible) => ({
      value: item.attributes.bibleid,
      label: item.attributes.pubdate === '' ? `${item.attributes.bibleName}` : `${item.attributes.bibleName} (${item.attributes.pubdate})`
    }));
    setQueryBible(false);
    setOptions(bibleOptions);
  }, [bibles])

  useEffect(() => {
    if (bibleOpt) {
      var size = Nt ? 'NT' : 'OT';
      axiosGet(`biblebrain/${bibleOpt.value}/${size}/${timing}/copyright`, undefined, token ?? '').then((response) => {
        setCopyright(response.data);
      });
    } else {
      setCopyright('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bibleOpt, Nt, timing]);

  useEffect(() => {
    var ind = bookN(passage?.attributes.book || 'MAT');
    console.log('index', ind)
    const isNt = bookN(passage?.attributes?.book || 'MAT') > 39;
    setNt(isNt);
    setQueryLang(true);
    setQueryBible(true);
    getLanguages(isNt, timing).then((langs) => setLanguages(langs));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timing, passage]);

  const handleTimingChange = (checked: boolean) => {
    setTiming(checked);
    setLang(null);
    setBibleOpt(null);
    setCreatePassages(checked);
    setCreateSections(checked);
    if (!checked) {
      setCreationScope(scopeI.chapter);
    }
  }
  const handleAdd = () => {
    if (addingRef.current) return;
    setAdding(true);

    var postdata:
      {
        PassageId: number
        SectionId: number;
        OrgWorkflowStep: number;
        Bibleid: string;
        Timing: boolean;
        NT: boolean;
        Sections: boolean;
        Passages: boolean;
        Scope: string;
      } = {
      PassageId: remoteIdNum(
        'passage',
        passage.id,
        memory.keyMap as RecordKeyMap
      ),
      SectionId: remoteIdNum(
        'section',
        section.id,
        memory.keyMap as RecordKeyMap
      ),
      OrgWorkflowStep: remoteIdNum(
        'orgworkflowstep',
        InternalizationStep()?.id ?? '',
        memory.keyMap as RecordKeyMap
      ),
      Bibleid: bibleOpt?.value ?? "",
      Timing: timing,
      NT: Nt,
      Sections: createSections,
      Passages: createPassages,
      Scope: scopeI.asString(creationScope)
    };
    axiosPost('biblebrain', postdata, token).then((response) => {
      //could process response as ChangeList but this is easier
      forceDataChanges();
      setTimeout(() => {
        waitForRemoteQueue('bible brain resource added').then(() => {
          setAdding(false);
          onClose && onClose();
        });
      }, 500);
    });
  };
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
                onChange={(_e, checked) => handleTimingChange(checked)}
              />
            }
            label={t.withTiming}
          />
          {!timing && <Typography variant="subtitle2">
            {t.generalresource}
          </Typography>}
          <Grid item>
            <Autocomplete
              disablePortal
              id="bb-lang"
              options={langOpts}
              value={lang}
              onChange={(_event, value) => setLang(value)}
              sx={{ width: 300 }}
              renderInput={(params) => (
                <TextField {...params} label={queryLang ? t.querying : t.language.replace('{0}', 'Bible Brain')} />
              )}
              disabled={queryLang}
            />
          </Grid>
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
                label={queryBible ? t.querying : t.resource.replace('{0}', 'Bible Brain') + '*'}
              />
            )}
            disabled={queryBible}
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
                disabled={!timing}
              />
            }
            label={t.resource.replace('{0}', t.passage)}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={createSections}
                onChange={(_e, checked) => setCreateSections(checked)}
                disabled={!timing}
              />
            }
            label={t.resource.replace('{0}', organizedBy)}
          />
        </FormControl>
        <FormControl
          component="fieldset"
          sx={{ border: '1px solid grey', mr: 1, px: 2 }}
        >
          <FormLabel component="legend">{t.scope}</FormLabel>
          <RadioGroup
            aria-labelledby="creation-scope-radio-buttons-label"
            value={(creationScope ?? scopeI.section).toString()}
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
                disabled={!timing && i < 2}
              />
            ))}
          </RadioGroup>
        </FormControl>

      </Grid>
      <Typography variant="body1" >
        {copyright}
      </Typography>
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
              adding ||
              (!createPassages && !createSections && timing) ||
              (creationScope === scopeI.passage && createSections)
            }
            onClick={() => handleAdd()}
          >
            {t.create}
          </PriButton>
        </ActionRow>
      </Grid>
    </Grid>
  );
}
