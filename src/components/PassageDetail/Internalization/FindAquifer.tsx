import {
  Autocomplete,
  Grid,
  IconButton,
  InputAdornment,
  OutlinedInput,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import PreviewIcon from '@mui/icons-material/Visibility';
import NoPreview from '@mui/icons-material/VisibilityOff';
import LinkIcon from '@mui/icons-material/Link';
import { useContext, useEffect, useState } from 'react';
import usePassageDetailContext from '../../../context/usePassageDetailContext';
import { parseRef } from '../../../crud';
import DataTable from '../../DataTable';
import { shallowEqual, useSelector } from 'react-redux';
import { findResourceSelector } from '../../../selector';
import { IFindResourceStrings } from '../../../model';
import { Sorting } from '@devexpress/dx-react-grid';
import { LightTooltip, PriButton } from '../../StepEditor';
import { OptionProps } from './FindTabs';
import Markdown from 'react-markdown';
import { LaunchLink } from '../../../control/LaunchLink';
import { axiosGet, axiosPost } from '../../../utils/axios';
import { TokenContext } from '../../../context/TokenProvider';

interface AquiferSearch {
  id: number;
  name: string;
  localizedName: string;
  mediaType: string;
  languageCode: string;
  grouping: {
    type: string;
    name: string;
    collectionTitle: string;
    collectionCode: string;
  };
}

interface AquiferLanguage {
  id: number;
  code: string;
  englishDisplay: string;
  localizedDisplay: string;
  scriptDirection: string;
}

interface LicenseByLang {
  [key: string]: {
    name: string;
    url: string;
  };
}

interface AquiferContent {
  id: number;
  name: string;
  localizedName: string;
  content: string[] | { url: string };
  language: {
    id: number;
    code: string;
    displayName: string;
    scriptDirection: number;
  };
  grouping: {
    name: string;
    type: string;
    mediaType: string;
    licenseInfo: {
      title: string;
      copyright: {
        dates: string;
        holder: {
          name: string;
          url: string;
        };
      };
      licenses: LicenseByLang[];
      showAdaptationNoticeForEnglish: boolean;
      showAdaptationNoticeForNonEnglish: boolean;
    };
  };
}

interface DataRow {
  id: number;
  select: boolean;
  name: string;
  mediaType: string;
  group: string;
  source: string;
}

export default function FindAquifer() {
  const { passage } = usePassageDetailContext();
  const [result, setResult] = useState<AquiferSearch[]>([]);
  const [data, setData] = useState<DataRow[]>([]);
  const [checks, setChecks] = useState<number[]>([]);
  const [count, setCount] = useState(0);
  const [languages, setLanguages] = useState<AquiferLanguage[]>([]);
  const [langOpts, setLangOpts] = useState<OptionProps[]>([]);
  const [lang, setLang] = useState<OptionProps | null>(null);
  const [query, setQuery] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [preview, setPreview] = useState(false);
  const [previewItem, setPreviewItem] = useState<DataRow | null>(null);
  const [content, setContent] = useState<AquiferContent | null>(null);
  const [link, setLink] = useState<string>();
  const t: IFindResourceStrings = useSelector(
    findResourceSelector,
    shallowEqual
  );
  const token = useContext(TokenContext).state.accessToken ?? '';
  const [limit, setLimit] = useState(100);
  const [offset, setOffset] = useState(0);
  const columnDefs = [
    { name: 'name', title: t.name },
    { name: 'mediaType', title: t.mediaType },
    { name: 'group', title: t.group },
    { name: 'source', title: t.source },
  ];
  const columnWidths = [
    { columnName: 'name', width: 200 },
    { columnName: 'mediaType', width: 100 },
    { columnName: 'group', width: 120 },
    { columnName: 'source', width: 200 },
  ];
  const columnFormatting = [
    { columnName: 'name', wordWrapEnabled: true },
    { columnName: 'group', wordWrapEnabled: true },
    { columnName: 'source', wordWrapEnabled: true },
  ];
  const sorting: Sorting[] = [{ columnName: 'name', direction: 'asc' }];

  useEffect(() => {
    if ((token ?? '') !== '')
      axiosGet('aquifer/languages', undefined, token ?? '').then((response) => {
        // console.log(response);
        setLanguages(response.data);
      });
  }, [token]);

  useEffect(() => {
    // console.log(languages);
    const langOptions = languages.map((item: AquiferLanguage) => ({
      value: item.code,
      label:
        `${item.localizedDisplay}` +
        (item.localizedDisplay !== item.englishDisplay
          ? ` (${item.englishDisplay})`
          : ''),
    }));
    setLangOpts(langOptions);
    setLang(langOptions.find((o) => o.value === 'eng') ?? null);
  }, [languages]);

  useEffect(() => {
    if (lang === null) return;
    parseRef(passage);
    const { book, startChapter, startVerse, endChapter, endVerse } =
      passage.attributes;
    const paramArr = [
      ['bookCode', book || 'MAT'],
      ['languageCode', lang?.value || 'eng'],
      ['limit', limit.toString()],
      ['offset', offset.toString()],
    ];
    if (startChapter) paramArr.push(['startChapter', startChapter.toString()]);
    if (startVerse) paramArr.push(['startVerse', startVerse.toString()]);
    if (endChapter) paramArr.push(['endChapter', endChapter.toString()]);
    if (endVerse) paramArr.push(['endVerse', endVerse.toString()]);

    if (query) {
      paramArr.push(['query', query]);
    }
    const searchParams = new URLSearchParams(paramArr);

    axiosGet('aquifer/aquifer-search', searchParams, token).then((response) => {
      // console.log(response);
      setCount(response.data.totalItemCount);
      setResult(response.data.items);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passage, lang, refresh]);

  useEffect(() => {
    const dataRows = result.map((item: AquiferSearch) => ({
      id: item.id,
      select: false,
      name: item.localizedName,
      mediaType: item.mediaType,
      group: item.grouping.type,
      source: item.grouping.name,
    }));
    setData(dataRows);
  }, [result]);

  useEffect(() => {
    if (previewItem && preview) {
      // console.log(previewItem);
      const paramArr = [
        ['contentId', previewItem.id.toString()],
        [
          'contentTextType',
          previewItem.mediaType.toLowerCase() === 'text' ? 'Markdown' : '0',
        ],
      ];
      const searchParams = new URLSearchParams(paramArr);
      axiosGet(
        `aquifer/content/${previewItem.id.toString()}`,
        searchParams,
        token
      ).then((response) => {
        console.log(response);
        setContent(response.data);
      });
    }
  }, [previewItem, preview, token]);

  const handleCheck = (chks: Array<number>) => {
    const newItem = chks.filter((c) => !checks.includes(c));
    if (newItem.length > 0) {
      const item = data.find((d) => d.id === newItem[0]);
      setPreviewItem(item ?? null);
    } else {
      setPreviewItem(null);
    }
    setChecks(chks);
  };

  const handleAdd = () => {
    var add: { ContentId: string; ContentType: string }[] = [];
    checks.forEach((c) => {
      var item = data.find((d) => d.id === c);
      if (item) {
        add.push({
          ContentId: item.id.toString(),
          ContentType:
            item.mediaType.toLowerCase() === 'text' ? 'Markdown' : '0',
        });
      }
    });
    /*var bodyFormData = new FormData();
    bodyFormData.append('content', add); */
    console.log(checks, add);
    axiosPost('aquifer', add, token).then((response) => {
      console.log(response);
    });
  };

  return (
    <Grid
      container
      spacing={2}
      sx={{ alignItems: 'center', justifyContent: 'center' }}
    >
      <Stack>
        <Grid
          container
          direction={'row'}
          spacing={2}
          sx={{ my: 1, alignItems: 'center' }}
        >
          <Grid item>
            <Autocomplete
              disablePortal
              id="aquifer-lang"
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
            <LightTooltip title={t.aquiferSearchTip}>
              <OutlinedInput
                id="query"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                endAdornment={
                  <InputAdornment position="end">
                    <IconButton
                      type="submit"
                      onClick={() => setRefresh(refresh + 1)}
                    >
                      <SearchIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => {
                        setQuery('');
                        setRefresh(refresh + 1);
                      }}
                    >
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                }
                inputProps={{
                  'aria-label': 'query',
                }}
              />
            </LightTooltip>
          </Grid>
          <Grid item>
            <LightTooltip title={t.preview}>
              <IconButton onClick={() => setPreview(!preview)}>
                {preview ? <PreviewIcon /> : <NoPreview />}
              </IconButton>
            </LightTooltip>
          </Grid>
          <Grid item>
            <PriButton onClick={handleAdd} disabled={checks.length === 0}>
              {t.add}
            </PriButton>
          </Grid>
        </Grid>
        {preview &&
          content &&
          (previewItem?.mediaType.toLowerCase() === 'text' ? (
            <Markdown>{(content.content as string[])[0]}</Markdown>
          ) : previewItem?.mediaType.toLowerCase() === 'image' ? (
            <img src={(content.content as any)?.url} alt={previewItem.name} />
          ) : previewItem?.mediaType.toLowerCase() === 'audio' ? (
            <IconButton
              onClick={() => setLink((content.content as any)?.mp3.url)}
            >
              <LinkIcon />
            </IconButton>
          ) : (
            <IconButton onClick={() => setLink((content.content as any)?.url)}>
              <LinkIcon />
            </IconButton>
          ))}
        {count > 100 && (
          <Typography variant="h6" component="h6">{`${Math.min(
            count,
            100
          )} of ${count} aquifer results`}</Typography>
        )}
        <DataTable
          columns={columnDefs}
          columnWidths={columnWidths}
          columnFormatting={columnFormatting}
          sorting={sorting}
          rows={data}
          select={handleCheck}
          checks={checks}
          shaping={true}
          expandedGroups={[]} // shuts off toolbar row
        />
      </Stack>
      <LaunchLink url={link} />
    </Grid>
  );
}
