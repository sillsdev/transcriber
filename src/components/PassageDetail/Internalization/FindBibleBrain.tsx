import {
  Autocomplete,
  Box,
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
import {
  SyntheticEvent,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { OptionProps, scopeI } from './FindTabs';
import { shallowEqual, useSelector } from 'react-redux';
import { findResourceSelector } from '../../../selector';
import { IFindResourceStrings } from '../../../model';
import {
  currentDateTime,
  infoMsg,
  logError,
  Severity,
  useBookN,
  useDataChanges,
  useWaitForRemoteQueue,
} from '../../../utils';
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
import { useGlobal } from '../../../context/GlobalContext';
import { RecordKeyMap } from '@orbit/records';
import { usePlanType } from '../../../crud';
import { AxiosError, HttpStatusCode } from 'axios';
import LinearProgress from '@mui/material/LinearProgress';
import { BibleBrain } from '../../../assets/brands';
import { useSnackBar } from '../../../hoc/SnackBar';
interface FindBibleBrainProps {
  onClose?: () => void;
  closeRequested: boolean;
  handleLink: (
    kind: string
  ) => (_event: SyntheticEvent, newValue: OptionProps | null) => void;
}

export default function FindBibleBrain({
  handleLink,
  onClose,
  closeRequested,
}: FindBibleBrainProps) {
  const forceDataChanges = useDataChanges();
  const waitForDataChangesQueue = useWaitForRemoteQueue('datachanges');
  const [memory] = useGlobal('memory');
  const [options, setOptions] = useState<OptionProps[]>([]);
  const [Nt, setNt] = useState<boolean>(true);
  const [Ot, setOt] = useState<boolean>(false);
  const [languages, setLanguages] = useState<VwBiblebrainlanguage[]>([]);
  const [bibles, setBibles] = useState<VwBiblebrainbible[]>([]);
  const [langOpts, setLangOpts] = useState<OptionProps[]>([]);
  const [lang, setLang] = useState<OptionProps | null>(null);
  const [timing, setTiming] = useState<boolean>(true);
  const [bibleOpt, setBibleOpt] = useState<OptionProps | null>(null);
  const [copyright, setCopyright] = useState('');
  const [createPassages, setCreatePassages] = useState<boolean>(true);
  const [createSections, setCreateSectionsx] = useState<boolean>(true);
  const [creationScope, setCreationScopex] = useState<scopeI>(scopeI.section);
  const { passage, section } = usePassageDetailContext();
  const { getOrganizedBy } = useOrganizedBy();
  const [organizedBy] = useState(getOrganizedBy(true));
  const [adding, setAddingx] = useState(false);
  const addingRef = useRef(false);
  const { InternalizationStep } = useSecResCreate(section);
  const [queryLang, setQueryLang] = useState(true);
  const [queryBible, setQueryBible] = useState(true);
  const bookN = useBookN();
  const [plan] = useGlobal('plan'); //will be constant here
  const planType = usePlanType();
  const [progress, setProgress] = useState(0);
  const [count, setCount] = useState(0);
  const token = useContext(TokenContext).state.accessToken ?? '';
  const t: IFindResourceStrings = useSelector(
    findResourceSelector,
    shallowEqual
  );
  const { getLanguages, getBibles } = useBibleBrain();
  const IntervalIdRef = useRef<NodeJS.Timeout>();
  const { showMessage } = useSnackBar();
  const [errorReporter] = useGlobal('errorReporter');

  const scopeOptions = [t.passage, organizedBy, t.chapter, t.book];

  const setAdding = (adding: boolean) => {
    setAddingx(adding);
    addingRef.current = adding;
  };
  const setCreationScope = (scope: scopeI) => {
    if (scope === scopeI.passage) setCreateSections(false);
    setCreationScopex(scope);
  };
  const setCreateSections = (createsections: boolean) => {
    setCreateSectionsx(createsections);
    if (createsections && creationScope === scopeI.passage)
      setCreationScope(scopeI.section);
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const isFlat = useMemo(() => planType(plan)?.flat, [plan]);

  useEffect(() => setCreatePassages(!isFlat), [isFlat]);

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
    var l = languages.find((v) => v.attributes.iso === lang.value);
    if (l) {
      setQueryBible(true);
      getBibles(lang.value, l.attributes.languageName, Nt, Ot, timing).then(
        (bibles) => {
          setBibles(bibles);
        }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  useEffect(() => {
    const bibleOptions = bibles.map((item: VwBiblebrainbible) => ({
      value: item.attributes.bibleid,
      label:
        item.attributes.pubdate === ''
          ? `${item.attributes.bibleName}`
          : `${item.attributes.bibleName} (${item.attributes.pubdate})`,
    }));
    setQueryBible(false);
    setOptions(bibleOptions);
  }, [bibles]);

  useEffect(() => {
    if (bibleOpt) {
      var size = Nt ? 'NT' : 'OT';
      axiosGet(
        `biblebrain/${bibleOpt.value}/${size}/${timing}/copyright`,
        undefined,
        token ?? ''
      ).then((response) => {
        setCopyright(response);
      });
    } else {
      setCopyright('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bibleOpt, Nt, timing]);

  useEffect(() => {
    const bookCd = bookN(passage?.attributes?.book || 'MAT');
    const isNt = bookCd > 39 && bookCd < 67;
    const isOt = bookCd < 40;
    setNt(isNt);
    setOt(isOt);
    setQueryLang(true);
    setQueryBible(true);
    getLanguages(isNt, isOt, timing).then((langs) => setLanguages(langs));
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
  };
  const AddResources = async () => {
    var postdata: {
      PassageId: number;
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
        memory?.keyMap as RecordKeyMap
      ),
      SectionId: remoteIdNum(
        'section',
        section.id,
        memory?.keyMap as RecordKeyMap
      ),
      OrgWorkflowStep: remoteIdNum(
        'orgworkflowstep',
        InternalizationStep()?.id ?? '',
        memory?.keyMap as RecordKeyMap
      ),
      Bibleid: bibleOpt?.value ?? '',
      Timing: timing,
      NT: Nt,
      Sections: createSections,
      Passages: createPassages,
      Scope: scopeI.asString(creationScope),
    };
    try {
      var response = await axiosPost('biblebrain', postdata, token);

      if (response.status === HttpStatusCode.Ok) {
        const getCount = async (resolve: (value?: unknown) => void) => {
          var cntresp = await axiosGet('biblebrain/count', undefined, token);
          if (cntresp === 0) {
            setProgress(0);
            clearInterval(IntervalIdRef.current);
            IntervalIdRef.current = undefined;
            resolve(0);
          } else {
            var p = ((total - cntresp) / total) * 100;
            setProgress(p);
            setCount(cntresp);
          }
        };
        var total = response.data;
        if (total > 0)
          await new Promise((resolve) => {
            IntervalIdRef.current = setInterval(() => getCount(resolve), 2000); // Call the function every 2 second
          });
        return total;
      }
    } catch (err) {
      showMessage('biblebrain add failed ' + (err as AxiosError).message);
      logError(
        Severity.error,
        errorReporter,
        infoMsg(err as Error, 'biblebrain add failed ')
      );
    }
  };

  const handleAdd = () => {
    if (addingRef.current) return;
    setAdding(true);
    let startTime = currentDateTime();
    AddResources().then(() => {
      forceDataChanges(startTime).then(() => {
        waitForDataChangesQueue('bible brain resource added').then(() => {
          setAdding(false);
          onClose && onClose();
        });
      });
    });
  };
  useEffect(() => {
    if (closeRequested && IntervalIdRef.current) {
      clearInterval(IntervalIdRef.current);
    }
  }, [closeRequested]);

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
          {!timing && (
            <Typography variant="subtitle2">{t.generalresource}</Typography>
          )}
          <Grid item>
            <Autocomplete
              disablePortal
              id="bb-lang"
              options={langOpts}
              value={lang}
              onChange={(_event, value) => setLang(value)}
              sx={{ width: 300 }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={
                    queryLang
                      ? t.querying
                      : t.language.replace('{0}', BibleBrain)
                  }
                />
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
                label={
                  queryBible
                    ? t.querying
                    : t.resource.replace('{0}', BibleBrain) + '*'
                }
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
          {!isFlat && (
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
          )}
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
            {scopeOptions
              .filter((o) => !isFlat || o !== t.passage)
              .map((o, i) => (
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
      <Typography variant="body1">{copyright}</Typography>
      {progress > 0 && (
        <Box sx={{ width: '100%' }}>
          <LinearProgress variant="determinate" value={progress} />
          <Typography>{count}</Typography>
        </Box>
      )}
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
