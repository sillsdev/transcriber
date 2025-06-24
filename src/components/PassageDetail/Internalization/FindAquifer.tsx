import {
  Autocomplete,
  Grid,
  Icon,
  IconButton,
  InputAdornment,
  OutlinedInput,
  Stack,
  styled,
  TextField,
  Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import PreviewIcon from '@mui/icons-material/Visibility';
import LinkIcon from '@mui/icons-material/Link';
import { useContext, useEffect, useRef, useState } from 'react';
import usePassageDetailContext from '../../../context/usePassageDetailContext';
import { parseRef, remoteIdNum, useRole, useSecResCreate } from '../../../crud';
import DataTable from '../../DataTable';
import { shallowEqual, useSelector } from 'react-redux';
import { findResourceSelector, gridSelector } from '../../../selector';
import { IFindResourceStrings, IGridStrings } from '../../../model';
import { Sorting } from '@devexpress/dx-react-grid';
import { LightTooltip, PriButton } from '../../StepEditor';
import { OptionProps } from './FindTabs';
import Markdown from 'react-markdown';
import { LaunchLink } from '../../../control/LaunchLink';
import { axiosGet, axiosPost } from '../../../utils/axios';
import { TokenContext } from '../../../context/TokenProvider';
import { useGlobal } from '../../../context/GlobalContext';
import { RecordKeyMap } from '@orbit/records';
import {
  infoMsg,
  logError,
  Severity,
  useDataChanges,
  useWaitForRemoteQueue,
} from '../../../utils';
import BigDialog from '../../../hoc/BigDialog';
import { Aquifer } from '../../../assets/brands';
import { useSnackBar } from '../../../hoc/SnackBar';
import { AxiosError } from 'axios';

const StyledStack = styled(Stack)(() => ({
  '& .MuiDataGrid-footerContainer': {
    display: 'none!important',
  },
}));

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

interface IProps {
  onClose?: () => void;
}

export default function FindAquifer({ onClose }: IProps) {
  const { passage, section } = usePassageDetailContext();
  const { InternalizationStep } = useSecResCreate(section);
  const [isOffline] = useGlobal('offline');
  const [memory] = useGlobal('memory');
  const [result, setResult] = useState<AquiferSearch[]>([]);
  const [data, setData] = useState<DataRow[]>([]);
  const [checks, setChecks] = useState<number[]>([]);
  const [count, setCount] = useState(0);
  const [languages, setLanguages] = useState<AquiferLanguage[]>([]);
  const [langOpts, setLangOpts] = useState<OptionProps[]>([]);
  const [lang, setLang] = useState<OptionProps | null>(null);
  const [query, setQuery] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [previewItem, setPreviewItem] = useState<DataRow | null>(null);
  const [content, setContent] = useState<AquiferContent | null>(null);
  const [link, setLink] = useState<string>();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [adding, setAddingx] = useState(false);
  const addingRef = useRef(false);
  const t: IFindResourceStrings = useSelector(
    findResourceSelector,
    shallowEqual
  );
  const tg: IGridStrings = useSelector(gridSelector, shallowEqual);
  const token = useContext(TokenContext).state.accessToken ?? '';
  const [limit] = useState(100); // TODO: always loads max of 100 results?
  const [offset, setOffset] = useState(0);
  const forceDataChanges = useDataChanges();
  const waitForDataChangesQueue = useWaitForRemoteQueue('datachanges');
  const { userIsAdmin } = useRole();
  const handlePreviewClick = (e: React.MouseEvent, row: DataRow) => {
    e.stopPropagation();
    setPreviewItem(row);
  };
  const { showMessage } = useSnackBar();
  const [errorReporter] = useGlobal('errorReporter');

  const columnDefs = [
    { name: 'name', title: t.name },
    { name: 'mediaType', title: t.mediaType },
    { name: 'group', title: t.group },
    { name: 'source', title: t.source },
    {
      name: 'preview',
      title: t.preview,
      renderCell: (params: any) => (
        <IconButton onClick={(e) => handlePreviewClick(e, params.row)}>
          <PreviewIcon />
        </IconButton>
      ),
    },
  ];
  const columnWidths = [
    { columnName: 'name', width: 200 },
    { columnName: 'mediaType', width: 100 },
    { columnName: 'group', width: 120 },
    { columnName: 'source', width: 200 },
    { columnName: 'preview', width: 100 },
  ];
  const columnFormatting = [
    { columnName: 'name', wordWrapEnabled: true },
    { columnName: 'group', wordWrapEnabled: true },
    { columnName: 'source', wordWrapEnabled: true },
  ];
  const sorting: Sorting[] = [{ columnName: 'name', direction: 'asc' }];

  const setAdding = (adding: boolean) => {
    setAddingx(adding);
    addingRef.current = adding;
  };

  useEffect(() => {
    if ((token ?? '') !== '')
      axiosGet('aquifer/languages', undefined, token).then((response) => {
        setLanguages(response);
      });
  }, [token]);

  useEffect(() => {
    if (languages) {
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
    }
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
      setCount(response.totalItemCount);
      setResult(response.items);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passage, lang, refresh, offset]);

  useEffect(() => {
    const dataRows = result.map((item: AquiferSearch) => ({
      id: item.id,
      select: false,
      name: item.localizedName,
      mediaType: item.mediaType,
      group: item.grouping?.type,
      source: item.grouping.name,
    }));
    setData(dataRows);
  }, [result]);

  useEffect(() => {
    if (previewItem) {
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
        setContent(response);
        setPreviewOpen(true);
      });
    }
  }, [previewItem, token]);

  const handleCheck = (chks: Array<number>) => {
    setChecks(chks);
  };

  const handleAdd = () => {
    if (addingRef.current) return;
    setAdding(true);
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
    var postdata: {
      PassageId?: number;
      SectionId?: number;
      OrgWorkflowStep: number;
      Items: { ContentId: string; ContentType: string }[];
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
      Items: add,
    };
    axiosPost('aquifer', postdata, token)
      .then((response) => {
        //could process response as ChangeList but this is easier
        forceDataChanges().then(() => {
          waitForDataChangesQueue('aquifer resource added').then(() => {
            setAdding(false);
            onClose && onClose();
          });
        });
      })
      .catch((err) => {
        showMessage('Aquifer add failed ' + (err as AxiosError).message);
        logError(
          Severity.error,
          errorReporter,
          infoMsg(err, 'Aquifer add failed ')
        );
      });
  };

  return (
    <Grid
      container
      spacing={2}
      sx={{ alignItems: 'center', justifyContent: 'center' }}
    >
      <StyledStack>
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
                <TextField
                  {...params}
                  label={t.language.replace('{0}', Aquifer)}
                />
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
          {userIsAdmin && !isOffline && (
            <Grid item>
              <PriButton
                onClick={handleAdd}
                disabled={checks.length === 0 || adding}
              >
                {t.add}
              </PriButton>
            </Grid>
          )}
        </Grid>
        {content && (
          <BigDialog
            title={t.preview}
            description={
              <Typography sx={{ pb: 2 }}>{previewItem?.name}</Typography>
            }
            isOpen={previewOpen}
            onOpen={(isOpen: boolean) => {
              setPreviewOpen(isOpen);
              if (!isOpen) setPreviewItem(null);
            }}
          >
            <>
              {previewItem?.mediaType.toLowerCase() === 'text' ? (
                <Markdown>{(content.content as string[])[0]}</Markdown>
              ) : previewItem?.mediaType.toLowerCase() === 'image' ? (
                <img
                  src={(content.content as any)?.url}
                  alt={previewItem?.name}
                />
              ) : previewItem?.mediaType.toLowerCase() === 'audio' ? (
                <IconButton
                  onClick={() => setLink((content.content as any)?.mp3.url)}
                >
                  <LinkIcon />
                </IconButton>
              ) : (
                <IconButton
                  onClick={() => setLink((content.content as any)?.url)}
                >
                  <LinkIcon />
                </IconButton>
              )}
            </>
          </BigDialog>
        )}

        {count > limit && (
          <Stack direction="row" spacing={2}>
            {offset > 0 ? (
              <IconButton
                onClick={() => setOffset(offset - limit)}
                title={t.previous}
              >
                <Icon>arrow_left</Icon>
              </IconButton>
            ) : (
              <></>
            )}
            <Typography variant="h6" component="h6">
              {t.showing
                .replace('{0}', `${offset + 1}`)
                .replace('{1}', `${Math.min(offset + limit, count)}`)
                .replace('{2}', `${count}`)
                .replace('{3}', Aquifer)}
            </Typography>
            {offset + limit < count ? (
              <IconButton
                onClick={() => setOffset(offset + limit)}
                title={t.next}
              >
                <Icon>arrow_right</Icon>
              </IconButton>
            ) : (
              <></>
            )}
          </Stack>
        )}
        {data.length > 0 ? (
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
        ) : (
          <Grid
            container
            sx={{ my: 1, alignItems: 'center', justifyContent: 'center' }}
          >
            <Grid item>
              <Typography variant="h6">{tg.noData}</Typography>
            </Grid>
          </Grid>
        )}
      </StyledStack>
      <LaunchLink url={link} reset={() => setLink('')} />
    </Grid>
  );
}
