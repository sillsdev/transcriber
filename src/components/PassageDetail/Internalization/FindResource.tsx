import { useEffect, useRef, useState } from 'react';
import {
  Autocomplete,
  Badge,
  Grid,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import RefreshIcon from '@mui/icons-material/Refresh';
import { BibleBrainItem } from '../../../model/bible-brain-item';
import { BibleProjectLang } from '../../../model/bible-project-lang';
import { BibleResource } from '../../../model/bible-resource';
import usePassageDetailContext from '../../../context/usePassageDetailContext';
import { camel2Title, launch } from '../../../utils';
import { useGlobal } from 'reactn';
import { AltButton } from '../../StepEditor';
import { parseRef, related } from '../../../crud';
import { pad3 } from '../../../utils/pad3';
import { useSnackBar } from '../../../hoc/SnackBar';
import { useSelector } from 'react-redux';
import { BookName, IState, PassageD, SectionD } from '../../../model';
import { useOrbitData } from '../../../hoc/useOrbitData';
import { isElectron } from '../../../api-variable';
import { SortBy, useKeyTerms } from '../Keyterms/useKeyTerms';

interface OptionProps {
  label: string;
  value: string;
}

const scopeOptions = [
  'passage',
  'section',
  'chapter',
  'movement',
  'book',
  'clipboard',
];

const typeOptions = [
  'oral version',
  'summary',
  'meaning',
  'script',
  'image',
  'video',
];

const aiQueries = [
  {
    type: 'oral-version',
    template: 'Please provide an oral translation of {0}',
  },
  {
    type: 'summary',
    template: 'Please provide a summary of {0}',
  },
  {
    type: 'meaning',
    template: 'Please draft a story to illustrate the meaning of {0}',
  },
  {
    type: 'script',
    template: 'Please provide a script for {0}',
  },
  {
    type: 'image',
    template: 'Please provide an image for {0}',
  },
  {
    type: 'video',
    template: 'Please provide a video for {0}',
  },
];

interface Tpl {
  [key: string]: string | undefined;
}

const hrefTpls: Tpl = {
  bibleBrain: 'https://live.bible.is/bible/{0}/{1}/{2}',
};

const ResourceItem = ({
  resource,
  onLink,
}: {
  resource: BibleResource;
  onLink?: (link: string) => void;
}) => {
  const { passage } = usePassageDetailContext();
  const { showMessage } = useSnackBar();
  const [open, setOpen] = useState(false);
  const [isOffline] = useGlobal('offline');

  const handleClick = (_kind: string, hrefTpl: string) => () => {
    const book = passage?.attributes?.book;
    parseRef(passage);
    const href = hrefTpl
      .replace('{0}', book ?? 'MAT')
      .replace('{1}', pad3(passage?.attributes?.startChapter ?? 1))
      .replace('{2}', pad3(passage?.attributes?.startVerse ?? 1))
      .replace('{3}', pad3(passage?.attributes?.endChapter ?? 1))
      .replace('{4}', pad3(passage?.attributes?.endVerse ?? 1));
    console.log(`launching ${href}`);
    if (isElectron) launch(href, !isOffline);
    else onLink?.(href);
  };

  const handleHelp = (resource?: BibleResource) => () => {
    showMessage(resource?.help && !open ? resource.help : '');
    setOpen(!open);
  };

  return (
    <Grid key={resource.name} item>
      {resource?.href ? (
        <AltButton
          onClick={handleClick(resource.name, resource.href)}
          title={resource.help}
          variant="outlined"
          sx={{ m: 1 }}
        >
          {resource.ai ? (
            <Badge badgeContent="AI">{resource.name}</Badge>
          ) : (
            resource.name
          )}
        </AltButton>
      ) : (
        <AltButton
          title={resource.help}
          variant="outlined"
          sx={{ m: 1 }}
          onClick={handleHelp(resource)}
        >
          {resource.ai ? (
            <Badge badgeContent="AI">{resource.name}</Badge>
          ) : (
            resource.name
          )}
        </AltButton>
      )}
    </Grid>
  );
};

export const FindResource = () => {
  const { passage } = usePassageDetailContext();
  const passages = useOrbitData<PassageD[]>('passage');
  const sections = useOrbitData<SectionD[]>('section');
  const [options, setOptions] = useState<OptionProps[]>([]);
  const [bibleProjectLangs, setBibleProjectLangs] = useState<OptionProps[]>([]);
  const [links, setLinks] = useState<Tpl>({});
  const [resources, setResources] = useState<BibleResource[]>([]);
  const [isOffline] = useGlobal('offline');
  const [planId] = useGlobal('plan');
  const [query, setQuery] = useState('');
  const [userEdited, setUserEdited] = useState(false);
  const [scope, setScope] = useState<string>('passage');
  const [type, setType] = useState('oral version');
  const linkRef = useRef<HTMLAnchorElement>(null);
  const { verseTerms } = useKeyTerms();
  const [terms, setTerms] = useState<string[]>([]);
  const [typeOpts, setTypeOpts] = useState<OptionProps[]>([]);
  const [scopeOpts, setScopeOpts] = useState<OptionProps[]>([]);
  const allBookData: BookName[] = useSelector(
    (state: IState) => state.books.bookData
  );

  const computeMovementRef = () => {
    const sectionId = related(passage, 'section');
    const section = sections.find((s) => s.id === sectionId) as SectionD;
    const movements = sections
      .filter(
        (s) =>
          related(s, 'plan') === planId &&
          s.attributes.sequencenum !== Math.floor(s.attributes.sequencenum)
      )
      .sort((a, b) => b.attributes.sequencenum - a.attributes.sequencenum);
    const movementsB4 = movements.filter(
      (m) => m.attributes.sequencenum < section?.attributes.sequencenum
    );
    const movement = movementsB4.length > 0 ? movementsB4[0] : undefined;
    const sortedSections = sections
      .filter((s) => related(s, 'plan') === planId)
      .sort((a, b) => a.attributes.sequencenum - b.attributes.sequencenum);
    const startIndex = movement
      ? sortedSections.findIndex((s) => s.id === movement?.id)
      : 0;
    let endIndex = sortedSections.findIndex(
      (s) =>
        s.attributes.sequencenum > section?.attributes.sequencenum &&
        s.attributes.sequencenum !== Math.floor(s.attributes.sequencenum)
    );
    if (endIndex === -1) {
      endIndex = sortedSections.length;
    }
    let startChapter = undefined;
    let startVerse = undefined;
    for (let i = startIndex; i < endIndex; i++) {
      const secPass = passages.filter(
        (p) =>
          related(p, 'section') === sortedSections[i]?.id &&
          p.attributes.sequencenum === 1
      );
      if (secPass.length > 0) {
        parseRef(secPass[0]);
        startChapter = secPass[0]?.attributes.startChapter;
        startVerse = secPass[0]?.attributes.startVerse;
        break;
      }
    }
    let endChapter = undefined;
    let endVerse = undefined;
    for (let i = endIndex - 1; i >= startIndex; i--) {
      const secPass = passages
        .filter(
          (p) =>
            related(p, 'section') === sortedSections[i]?.id &&
            p.attributes.sequencenum === Math.floor(p.attributes.sequencenum)
        )
        .sort((a, b) => b.attributes.sequencenum - a.attributes.sequencenum);
      if (secPass.length > 0) {
        parseRef(secPass[0]);
        endChapter = secPass[0]?.attributes.endChapter;
        endVerse = secPass[0]?.attributes.endVerse;
        break;
      }
    }
    if (startChapter === endChapter) {
      return `${startChapter}:${startVerse}-${endVerse}`;
    } else {
      return `${startChapter}:${startVerse}-${endChapter}:${endVerse}`;
    }
  };

  const computeSectionRef = () => {
    const sectionId = related(passage, 'section');
    const firstPassage = passages.find(
      (p) =>
        related(p, 'section') === sectionId && p.attributes.sequencenum === 1
    );
    const lastPassage = passages
      .filter((p) => related(p, 'section') === sectionId)
      .sort((a, b) => b.attributes.sequencenum - a.attributes.sequencenum)[0];
    parseRef(firstPassage as PassageD);
    parseRef(lastPassage);
    if (
      firstPassage?.attributes.startChapter ===
      lastPassage?.attributes.endChapter
    ) {
      return `${firstPassage?.attributes.startChapter}:${firstPassage?.attributes.startVerse}-${lastPassage?.attributes.endVerse}`;
    } else {
      return `${firstPassage?.attributes.startChapter}:${firstPassage?.attributes.startVerse}-${lastPassage?.attributes.endChapter}:${lastPassage?.attributes.endVerse}`;
    }
  };

  const computeQuery = async (type: string, scope: string) => {
    const book =
      allBookData.find((b) => b.code === passage?.attributes?.book ?? 'MAT')
        ?.short ?? 'Matthew';
    let ref = `${book} ${passage?.attributes?.reference ?? '1:1'}`;
    if (scope === 'section') {
      ref = `${book} ${computeSectionRef()}`;
    } else if (scope === 'chapter') {
      const chapter = parseInt(passage?.attributes?.reference ?? '1');
      ref = `${book} ${chapter}`;
    } else if (scope === 'movement') {
      ref = `${book} ${computeMovementRef()}`;
    } else if (scope === 'book') {
      ref = `the biblical book of {0}`.replace('{0}', book);
    } else if (scope === 'clipboard') {
      try {
        ref = `"${await navigator.clipboard.readText()}"`;
      } catch (e) {
        console.log(e);
        ref = 'unavailable';
      }
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
    console.log(terms);
    setTerms(terms);
    setScopeOpts(scopeOptions.concat(terms).map(optVal));
  };

  const optVal = (item: string) => ({ value: item, label: camel2Title(item) });

  useEffect(() => {
    import('../../../assets/biblebrain_2021-08-22.js').then((module) => {
      setOptions(
        module.default.map((item: BibleBrainItem) => ({
          label: `${item.lang_name} (${item.iso}) - [${item.bible_id}] ${item.bible_name}`,
          value: item.bible_id,
        }))
      );
    });
    import('../../../assets/bibleprojectlang_2024-08-23.js').then((module) => {
      setBibleProjectLangs(
        module.default.map((item: BibleProjectLang) => ({
          label: `${item.item} - [${item.local}]`,
          value: item.href,
        }))
      );
    });
    import('../../../assets/bible-resource.js').then((module) => {
      setResources(module.default);
    });
    setTypeOpts(typeOptions.map(optVal));
  }, []);

  useEffect(() => {
    if (userEdited) {
      return;
    }
    computeQuery(type, scope || 'passage');
    computeTerms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passage, scope, type, allBookData, userEdited]);

  const doLink = (link: string | undefined) => {
    if (!link) return;
    if (isElectron) {
      launch(link, !isOffline);
    } else {
      linkRef.current?.setAttribute('href', link);
      linkRef.current?.click();
    }
  };

  const handleChange =
    (kind: string) =>
    (_event: React.SyntheticEvent, newValue: OptionProps | null) => {
      console.log(newValue);
      const book = passage?.attributes?.book;
      let link = newValue?.value ?? '';
      if (hrefTpls[kind]) {
        const chapter = parseInt(passage?.attributes?.reference ?? '1');
        link = newValue?.value
          ? hrefTpls[kind]
              ?.replace('{0}', newValue?.value ?? '')
              ?.replace('{1}', book ?? 'MAT')
              ?.replace('{2}', chapter.toString()) ?? ''
          : '';
        setLinks({ ...links, [kind]: link });
      }
      doLink(link);
    };

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

  const handleRefresh = () => {
    setUserEdited(false);
    computeQuery(type, scope || 'passage');
  };

  return (
    <Grid container>
      <Grid item xs={12} md={6}>
        <Grid
          container
          spacing={2}
          sx={{ alignItems: 'center', justifyContent: 'center' }}
        >
          {resources
            .filter((r) => r.featured)
            .map((resource) => (
              <ResourceItem resource={resource} onLink={doLink} />
            ))}
          <Grid item>
            <Stack direction={'row'} sx={{ m: 1 }}>
              <Autocomplete
                disablePortal
                id="bible-brain-resource"
                options={options}
                onChange={handleChange('bibleBrain')}
                sx={{ width: 300 }}
                renderInput={(params) => (
                  <TextField {...params} label="Bible Brain Resource" />
                )}
              />
            </Stack>
          </Grid>
          <Grid item>
            <Stack direction={'row'} sx={{ m: 1 }}>
              <Autocomplete
                disablePortal
                id="bible-project-lang"
                options={bibleProjectLangs}
                onChange={handleChange('bibleProject')}
                sx={{ width: 300 }}
                renderInput={(params) => (
                  <TextField {...params} label="Bible Project Language" />
                )}
              />
            </Stack>
          </Grid>
        </Grid>
        <Grid container spacing={2} sx={{ justifyContent: 'center' }}>
          {resources
            .filter((r) => !r.featured && !r.ai)
            .map((resource) => (
              <ResourceItem resource={resource} onLink={doLink} />
            ))}
        </Grid>
      </Grid>
      <Grid item xs={12} md={6}>
        <Grid container>
          <Grid container spacing={2} sx={{ my: 1 }}>
            <Grid item>
              <Autocomplete
                disablePortal
                id="scope"
                options={typeOpts}
                value={typeOpts.find((item) => item.value === type) ?? null}
                onChange={handleTypeChange}
                sx={{ width: 180 }}
                renderInput={(params) => <TextField {...params} label="Type" />}
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
                  <TextField {...params} label="Scope" />
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
                label="Query"
                value={query}
                onChange={handleQueryChange}
                sx={{ flexGrow: 1 }}
              />
              <Stack>
                <IconButton onClick={handleCopy} title="Copy to clipboard">
                  <ContentCopyIcon />
                </IconButton>
                {userEdited && (
                  <IconButton onClick={handleRefresh} title="Reset">
                    <RefreshIcon />
                  </IconButton>
                )}
              </Stack>
            </Stack>
          </Grid>
          <Grid item xs={12}>
            <Typography>
              Copy query contents and paste them into one of an AI chat tools:
            </Typography>
          </Grid>
          <Grid container spacing={2} sx={{ justifyContent: 'center' }}>
            {resources
              .filter((r) => !r.featured && r.ai)
              .map((resource) => (
                <ResourceItem resource={resource} onLink={doLink} />
              ))}
          </Grid>
        </Grid>
      </Grid>
      {/* eslint-disable-next-line jsx-a11y/anchor-has-content, jsx-a11y/anchor-is-valid */}
      <a ref={linkRef} href="#" target="_blank" rel="noopener noreferrer"></a>
    </Grid>
  );
};
