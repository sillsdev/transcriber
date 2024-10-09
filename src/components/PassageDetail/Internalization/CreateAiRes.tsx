import {
  Autocomplete,
  FormControl,
  FormLabel,
  Grid,
  IconButton,
  Stack,
  TextField,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import RefreshIcon from '@mui/icons-material/Refresh';
import ResourceItem from './ResourceItem';
import { AltButton } from '../../../control';
import { useEffect, useState } from 'react';
import { BookName, IFindResourceStrings, IState } from '../../../model';
import { shallowEqual, useSelector } from 'react-redux';
import { findResourceSelector } from '../../../selector';
import { OptionProps } from './FindTabs';
import { BibleResource } from '../../../model/bible-resource';
import { LaunchLink } from '../../../control/LaunchLink';
import { camel2Title } from '../../../utils/camel2Title';
import usePassageDetailContext from '../../../context/usePassageDetailContext';
import { parseRef } from '../../../crud/passage';
import { SortBy, useKeyTerms } from '../Keyterms/useKeyTerms';
import { useComputeRef } from './useComputeRef';
import { scopeI } from './FindTabs';
import { useOrganizedBy } from '../../../crud/useOrganizedBy';
import ClearIcon from '@mui/icons-material/Clear';
import { PassageTypeEnum } from '../../../model/passageType';
import { passageTypeFromRef } from '../../../control/RefRender';
import { useGlobal } from 'reactn';
import { usePlanType, useSharedResRead } from '../../../crud';

interface CreateAiResProps {
  resources: BibleResource[];
}

export default function CreateAiRes({ resources }: CreateAiResProps) {
  const [typeOpts, setTypeOpts] = useState<OptionProps[]>([]);
  const [scopeOpts, setScopeOpts] = useState<OptionProps[]>([]);
  const [plan] = useGlobal('plan');
  const { flat } = usePlanType()(plan);
  const [query, setQuery] = useState('');
  const [userEdited, setUserEdited] = useState(false);
  const [scope, setScope] = useState<string>('');
  const [type, setType] = useState('');
  const [terms, setTerms] = useState<string[]>([]);
  const { passage } = usePassageDetailContext();
  const { computeMovementRef, computeSectionRef } = useComputeRef();
  const { verseTerms } = useKeyTerms();
  const [link, setLink] = useState<string>();
  const readSharedResource = useSharedResRead();
  const allBookData: BookName[] = useSelector(
    (state: IState) => state.books.bookData
  );
  const { getOrganizedBy } = useOrganizedBy();
  const [organizedBy] = useState(getOrganizedBy(true));
  const t: IFindResourceStrings = useSelector(
    findResourceSelector,
    shallowEqual
  );

  const scopeOptions = [
    t.passage.toLowerCase(),
    organizedBy.toLowerCase(),
    t.chapter.toLowerCase(),
    t.book.toLowerCase(),
    t.movement.toLowerCase(),
  ];

  const aiQueries = [
    {
      type: t.oralVersion,
      template: t.oralVersionTpl,
    },
    {
      type: t.summary,
      template: t.summaryTpl,
    },
    {
      type: t.meaning,
      template: t.meaningTpl,
    },
    {
      type: t.script,
      template: t.scriptTpl,
    },
    {
      type: t.image,
      template: t.imageTpl,
    },
    {
      type: t.video,
      template: t.videoTpl,
    },
  ];

  const optVal = (item: string) => ({ value: item, label: camel2Title(item) });

  useEffect(() => {
    setTypeOpts(aiQueries.map((q) => q.type.replace('-', ' ')).map(optVal));
    setScope(scopeOptions[0]);
    setType(aiQueries[0].type.replace('-', ' '));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const computeQuery = async (type: string, scope: string) => {
    // the localized name Matthew should never be used b/c book data will have it.
    const book =
      allBookData.find((b) => b.code === (passage?.attributes?.book ?? 'MAT'))
        ?.short ?? 'Matthew';
    let ref = `${book} ${passage?.attributes?.reference ?? '1:1'}`;
    if (
      passageTypeFromRef(passage?.attributes?.reference, flat) ===
      PassageTypeEnum.NOTE
    ) {
      const sharedResource = readSharedResource(passage?.id ?? '');
      if (sharedResource) {
        ref = `${sharedResource.attributes.title} (${book} ${computeSectionRef(
          passage
        )})`;
      }
    }
    if (scope === scopeOptions[scopeI.section]) {
      ref = `${book} ${computeSectionRef(passage)}`;
    } else if (scope === scopeOptions[scopeI.chapter]) {
      const chapter = parseInt(computeSectionRef(passage) ?? '1');
      ref = `${book} ${chapter}`;
    } else if (scope === scopeOptions[scopeI.movement]) {
      ref = `${book} ${computeMovementRef(passage)}`;
    } else if (scope === scopeOptions[scopeI.book]) {
      ref = t.biblicalBook.replace('{0}', book);
    } else if (terms.includes(scope)) {
      ref = camel2Title(scope);
    }

    const aiQuery = aiQueries.find((q) => q.type === type.replace(' ', '-'));
    setQuery(aiQuery?.template.replace('{0}', ref) ?? '');
  };

  const computeTerms = () => {
    parseRef(passage);
    const { book, startChapter, startVerse, endChapter, endVerse } =
      passage.attributes;
    const terms = verseTerms(
      book,
      startChapter ?? 1,
      startVerse ?? 1,
      endChapter ?? startChapter ?? 1,
      endVerse ?? startVerse ?? 1,
      SortBy.Gloss
    ).map((t) => t['G'].toLowerCase());
    setTerms(terms);
    setScopeOpts(scopeOptions.concat(terms).map(optVal));
  };

  useEffect(() => {
    if (userEdited) {
      return;
    }
    computeQuery(type, scope);
    computeTerms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passage, scope, type, allBookData, userEdited]);

  const handleTypeChange = (
    _event: React.SyntheticEvent,
    newValue: OptionProps | null
  ) => {
    setType(newValue?.value ?? '');
  };

  const handleScopeChange = (
    _event: React.SyntheticEvent,
    newValue: OptionProps | null
  ) => {
    setScope(newValue?.value ?? '');
  };

  const handleQueryChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setQuery(e.target.value);
    setUserEdited(true);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(query);
  };

  const handleClear = () => {
    setQuery('');
    setUserEdited(true);
  };

  const handleRefresh = () => {
    setUserEdited(false);
    computeQuery(type, scope);
  };

  return (
    <Grid container>
      <FormControl
        component={'fieldset'}
        sx={{ border: '1px solid grey', flexGrow: 1, mx: 2 }}
      >
        <FormLabel component={'legend'}>{t.queryBuilder}</FormLabel>
        <Grid container spacing={2} sx={{ my: 1, justifyContent: 'center' }}>
          <Grid item>
            <Autocomplete
              disablePortal
              id="scope"
              options={typeOpts}
              value={typeOpts.find((item) => item.value === type) ?? null}
              onChange={handleTypeChange}
              sx={{ width: 180 }}
              renderInput={(params) => <TextField {...params} label={t.type} />}
            />
          </Grid>
          <Grid item>
            <Autocomplete
              disablePortal
              id="scope"
              options={scopeOpts}
              value={scopeOpts.find((item) => item.value === scope) ?? null}
              onChange={handleScopeChange}
              sx={{ width: 300 }}
              renderInput={(params) => (
                <TextField {...params} label={t.scope} />
              )}
            />
          </Grid>
        </Grid>
        <Grid container spacing={2} sx={{ my: 1, justifyContent: 'center' }}>
          <Stack
            direction={'row'}
            sx={{ mx: 1, flexGrow: 1, alignItems: 'flex-end' }}
          >
            <TextField
              multiline
              minRows={2}
              label={t.query}
              value={query}
              onChange={handleQueryChange}
              sx={{ flexGrow: 1, ml: 2 }}
            />
            <Stack>
              <IconButton onClick={handleCopy} title={t.clipboardCopy}>
                <ContentCopyIcon />
              </IconButton>
              <IconButton onClick={handleClear} title={t.clearQuery}>
                <ClearIcon />
              </IconButton>
              {userEdited && (
                <IconButton onClick={handleRefresh} title={t.reset}>
                  <RefreshIcon />
                </IconButton>
              )}
            </Stack>
          </Stack>
        </Grid>
      </FormControl>
      <FormControl
        component={'fieldset'}
        sx={{ border: '1px solid grey', flexGrow: 1, mx: 2 }}
      >
        <FormLabel component={'legend'}>{t.aiDesc}</FormLabel>
        <Grid container spacing={2} sx={{ justifyContent: 'center' }}>
          {resources
            .filter((r) => !r.featured && r.ai)
            .map((resource) => (
              <ResourceItem
                key={resource.name}
                resource={resource}
                onLink={setLink}
              />
            ))}
        </Grid>
      </FormControl>
      <Grid container spacing={2} sx={{ justifyContent: 'center' }}>
        <Grid item>
          <AltButton onClick={() => setLink('https://ttsmp3.com//')}>
            {t.convert}
          </AltButton>
        </Grid>
      </Grid>
      <LaunchLink url={link} reset={() => setLink('')} />
    </Grid>
  );
}
