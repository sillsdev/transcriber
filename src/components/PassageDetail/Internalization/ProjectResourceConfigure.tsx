import { useState, useEffect, useRef, useContext, ChangeEvent } from 'react';
import { useGlobal } from 'reactn';
import {
  Section,
  IPassageDetailArtifactsStrings,
  ITranscriptionTabStrings,
  ISharedStrings,
  MediaFile,
  MediaFileD,
  SectionResource,
  BookName,
} from '../../../model';
import {
  Box,
  IconButton,
  Paper,
  PaperProps,
  Stack,
  TextField,
  debounce,
  styled,
} from '@mui/material';
import SkipIcon from '@mui/icons-material/InsertPageBreak';
import DataSheet from 'react-datasheet';
import 'react-datasheet/lib/react-datasheet.css';
import { PassageDetailPlayer } from '../PassageDetailPlayer';
import { parseRegions, IRegion } from '../../../crud/useWavesurferRegions';
import { prettySegment } from '../../../utils/prettySegment';
import { cleanClipboard } from '../../../utils/cleanClipboard';
import { NamedRegions, updateSegments } from '../../../utils/namedSegments';
import { findRecord } from '../../../crud/tryFindRecord';
import { related } from '../../../crud/related';
import {
  resourceSelector,
  sharedSelector,
  transcriptionTabSelector,
} from '../../../selector';
import { shallowEqual, useSelector } from 'react-redux';
import { UnsavedContext } from '../../../context/UnsavedContext';
import { useProjectResourceSave } from './useProjectResourceSave';
import { useProjectSegmentSave } from './useProjectSegmentSave';
import { useFullReference, IInfo } from './useFullReference';
import { useSnackBar } from '../../../hoc/SnackBar';
import {
  ActionRow,
  AltButton,
  GrowingSpacer,
  LightTooltip,
  PriButton,
} from '../../../control';
import { RecordIdentity, RecordTransformBuilder } from '@orbit/records';
import { useOrbitData } from '../../../hoc/useOrbitData';
import Delete from '@mui/icons-material/Delete';

const NotTable = 408;

const wizToolId = 'ProjResWizard';

const StyledPaper = styled(Paper)<PaperProps>(({ theme }) => ({
  backgroundColor: theme.palette.background.default,
  marginBottom: theme.spacing(1),
  '& .MuiPaper-rounded': {
    borderRadius: '8px',
  },
  overflow: 'auto',
}));

const StyledTable = styled('div')(({ theme }) => ({
  padding: theme.spacing(2),
  '& .data-grid .cell': {
    height: '48px',
  },
  '& .cTitle': {
    fontWeight: 'bold',
  },
  '& .lim': {
    verticalAlign: 'inherit !important',
    '& .value-viewer': {
      textAlign: 'center',
    },
  },
  '& .ref': {
    verticalAlign: 'inherit !important',
  },
  '& .des': {
    verticalAlign: 'inherit !important',
    '& .value-viewer': {
      textAlign: 'left',
    },
  },
}));

interface ICell {
  value: any;
  readOnly?: boolean;
  width?: number;
  className?: string;
}

interface ICellChange {
  cell: any;
  row: number;
  col: number;
  value: string | null;
}

interface IProps {
  media: MediaFileD | undefined;
  items: RecordIdentity[];
  onOpen?: (open: boolean) => void;
  bookData?: BookName[];
}

export const ProjectResourceConfigure = (props: IProps) => {
  const { media, items, onOpen } = props;
  const mediafiles = useOrbitData<MediaFile[]>('mediafile');
  const sectionResources = useOrbitData<SectionResource[]>('sectionresource');
  const [memory] = useGlobal('memory');
  const [, setComplete] = useGlobal('progress');
  const [data, setDatax] = useState<ICell[][]>([]);
  const [suffix, setSuffix] = useState('');
  const [numSegments, setNumSegments] = useState(0);
  const [pastedSegments, setPastedSegments] = useState('');
  const [heightStyle, setHeightStyle] = useState({
    maxHeight: `${window.innerHeight - NotTable}px`,
  });
  const dataRef = useRef<ICell[][]>([]);
  const infoRef = useRef<IInfo[]>([]);
  const segmentsRef = useRef('{}');
  const fullReference = useFullReference(props.bookData);
  const t: IPassageDetailArtifactsStrings = useSelector(
    resourceSelector,
    shallowEqual
  );
  const tt: ITranscriptionTabStrings = useSelector(
    transcriptionTabSelector,
    shallowEqual
  );
  const ts: ISharedStrings = useSelector(sharedSelector, shallowEqual);
  const {
    toolChanged,
    toolsChanged,
    isChanged,
    saveRequested,
    startSave,
    saveCompleted,
    clearRequested,
    clearCompleted,
    checkSavedFn,
  } = useContext(UnsavedContext).state;
  const savingRef = useRef(false);
  const canceling = useRef(false);
  const projectResourceSave = useProjectResourceSave();
  const projectSegmentSave = useProjectSegmentSave();
  const { showMessage } = useSnackBar();

  const readOnlys = [false, true, false, true];
  const widths = [150, 200, 400, 100];
  const cClass = ['lim', 'ref', 'des', 'act'];

  enum ColName {
    Limits,
    Ref,
    Desc,
    Action,
  }
  const setDimensions = () => {
    setHeightStyle({
      maxHeight: `${window.innerHeight - NotTable}px`,
    });
  };

  useEffect(() => {
    setDimensions();
    const handleResize = debounce(() => {
      setDimensions();
    }, 100);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  const rowCells = (row: string[], first = false) =>
    row.map(
      (v, i) =>
        ({
          value: v,
          width: widths[i],
          readOnly: first || readOnlys[i],
          className: first ? 'cTitle' : cClass[i],
        } as ICell)
    );

  const emptyTable = () => [
    rowCells([t.startStop, t.reference, t.description, t.action], true),
  ];

  const setData = (newData: ICell[][]) => {
    setDatax(newData);
    dataRef.current = newData;
  };
  useEffect(() => {
    if (items?.length > 0) {
      let newData: ICell[][] = emptyTable();
      const newInfo = items.map((v) => {
        const rec = memory.cache.query((q) => q.findRecord(v));
        if (!rec) return {} as IInfo;
        if (v.type === 'passage') {
          const section = findRecord(
            memory,
            'section',
            related(rec, 'section')
          ) as Section;
          if (!section) return {} as IInfo;
          const secNum = section?.attributes?.sequencenum || 0;
          return { secNum, section, passage: rec } as IInfo;
        } else {
          const section = rec as Section;
          const secNum = section?.attributes?.sequencenum || 0;
          return { secNum, section } as IInfo;
        }
      });
      newInfo.forEach((v, i) => {
        newData.push(rowCells(['', fullReference(v), '', `${i}`]));
      });
      infoRef.current = newInfo;
      setData(newData);
      if (segmentsRef.current) handleSegment(segmentsRef.current, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  const hasRef = (row: ICell[]) =>
    row.length > 0 &&
    row[ColName.Ref].value !== t.unused &&
    row[ColName.Ref].value !== '';

  const writeResources = async () => {
    if (!savingRef.current) {
      savingRef.current = true;
      if (media) {
        const t = new RecordTransformBuilder();
        let ix = 0;
        const d = dataRef.current;
        const total = infoRef.current.length;
        for (let i of infoRef.current) {
          if (canceling.current) break;
          ix += 1;
          let row = d[ix];
          while (!hasRef(row) && ix < d.length) {
            ix += 1;
            row = d[ix];
          }
          const limitValue = row[ColName.Limits].value;
          let topic = row[ColName.Desc].value;
          let refValue = row[ColName.Ref].value;
          if (limitValue && refValue) {
            await projectResourceSave({
              t,
              media,
              i,
              topicIn: topic ? topic : `${refValue} ${suffix}`,
              limitValue,
              mediafiles,
              sectionResources,
            });
          }
          setComplete(Math.min((ix * 100) / total, 100));
        }
        projectSegmentSave({
          media,
          segments: updateSegments(
            NamedRegions.ProjectResource,
            media.attributes?.segments,
            segmentsRef.current
          ),
        })
          .then(() => {
            saveCompleted(wizToolId);
          })
          .catch((err) => {
            //so we don't come here...we go to continue/logout
            saveCompleted(wizToolId, err.message);
          })
          .finally(() => {
            savingRef.current = false;
            canceling.current = false;
            setComplete(0);
            onOpen && onOpen(false);
          });
      }
    }
  };

  const handleCreate = () => {
    if (!saveRequested(wizToolId)) {
      startSave(wizToolId);
    }
  };

  useEffect(() => {
    if (saveRequested(wizToolId) && !savingRef.current) writeResources();
    else if (clearRequested(wizToolId)) clearCompleted(wizToolId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toolsChanged]);

  const handleCancel = () => {
    if (savingRef.current) {
      showMessage(t.canceling);
      canceling.current = true;
      return;
    }
    checkSavedFn(() => {
      toolChanged(wizToolId, false);
      onOpen && onOpen(false);
    });
  };

  const handleCopy = () => {
    const config: string[] = [];
    dataRef.current
      .filter((v, i) => i > 0)
      .forEach((row) => {
        config.push(
          `${row[ColName.Limits].value}\t${row[ColName.Ref].value}\t${
            row[ColName.Desc].value
          }`
        );
      });

    const content = config.join('\n');
    if (content.length > 0)
      navigator.clipboard
        .writeText(content)
        .then(() => {
          showMessage(tt.availableOnClipboard);
        })
        .catch((err) => {
          showMessage(tt.cantCopy);
        });
    else showMessage(tt.noData.replace('{0}', t.projectResourceConfigure));
  };

  const loadPastedSegments = (newData: ICell[][]) => {
    var psgIndexes = items.map((r) => r.type === 'passage');
    var segBoundaries = newData
      .filter((r, i) => i > 0 && psgIndexes[i - 1])
      .map((s) => s[ColName.Limits].value); //should be like "0.0-34.9"
    var regs = segBoundaries
      .map((b: string) => {
        var boundaries = b.split('-');
        if (
          boundaries.length > 1 &&
          !isNaN(parseFloat(boundaries[0])) &&
          !isNaN(parseFloat(boundaries[1]))
        )
          return {
            start: parseFloat(boundaries[0]),
            end: parseFloat(boundaries[1]),
          };
        return { start: 0, end: 0 };
      })
      .filter((r) => r.end > 0);
    if (media?.attributes.duration) {
      regs = regs.filter((r) => r.start <= media.attributes.duration);
    }
    var errors = segBoundaries.length - regs.length;
    var updated = 0;
    regs.forEach((r, i) => {
      if (media?.attributes.duration && r.end > media?.attributes.duration) {
        r.end = media?.attributes.duration;
        updated++;
      }
      if (i > 0 && r.start !== regs[i - 1].end) {
        r.start = regs[i - 1].end;
        updated++;
      }
    });
    setNumSegments(regs.length);
    setPastedSegments(JSON.stringify({ regions: JSON.stringify(regs) }));
    return { errors, updated };
  };
  const handleParsePaste = (clipBoard: string) => {
    const rawData = cleanClipboard(clipBoard);
    if (rawData.length === 0) {
      showMessage(tt.noData.replace('{0}', t.clipboard));
      return [];
    }
    const rawWidth = rawData[0].length;
    if (![2, 3].includes(rawWidth)) {
      showMessage(t.pasteFormat);
      return [];
    }
    let isCol0Ref = false;
    if (rawWidth === 2) {
      const col0 = rawData[0][0];
      for (let row of data) {
        if (row[ColName.Ref].value.trim() === col0) {
          isCol0Ref = true;
          break;
        }
      }
    }
    const refMap = new Map<string, string[]>();
    rawData.forEach((row) => {
      refMap.set(isCol0Ref ? row[0] : row[1], row);
    });
    let changed = false;
    const newData = data.map((row, i) => {
      if (i === 0) return row;
      const ref = row[ColName.Ref].value.trim();
      const raw = refMap.get(ref);
      if (!raw) return row;
      changed = true;
      if (rawWidth === 3) return rowCells(raw);
      if (isCol0Ref) return rowCells([row[ColName.Limits].value].concat(raw));
      return rowCells(raw.concat([row[ColName.Desc].value]));
    });
    if (!changed) {
      showMessage(t.pasteNoChange);
      return [];
    }
    var ret = loadPastedSegments(newData);
    if (ret.errors || ret.updated) {
      showMessage(
        t.pasteError
          .replace('{0}', ret.errors.toString())
          .replace('{1}', ret.updated.toString())
      );
    }

    return [];
  };

  const handleCellsChanged = (changes: Array<ICellChange>) => {
    const newData = dataRef.current.map((r) => r);
    changes.forEach((c) => {
      newData[c.row][c.col].value = c.value;
    });
    setData(newData);
  };

  const handleSegment = (segments: string, init: boolean) => {
    if (dataRef.current.length === 0) return;
    const regions = parseRegions(segments).regions.sort(
      (i, j) => i.start - j.start
    );

    setNumSegments(regions.length);

    // console.log('______');
    // regions.forEach((r) => console.log(prettySegment(r)));
    segmentsRef.current = segments;

    let change = false;
    let newData = new Array<ICell[]>();
    newData.push(dataRef.current[0]);
    const dlen = dataRef.current.length;
    const ilen = infoRef.current.length;
    let ix = 0;
    const regs = new Map<number, IRegion>();
    const secI = new Map<number, number>();
    regions.forEach((r, i) => {
      const v = prettySegment(r);
      while (ix < ilen && infoRef.current[ix].passage === undefined) {
        secI.set(infoRef.current[ix].secNum, ix + 1);
        ix += 1;
        newData.push(dataRef.current[ix]);
      }
      if (ix < ilen) {
        const [vStart, vEnd] = v.split('-').map((n) => parseFloat(n));
        const secNum = infoRef.current[ix].secNum;
        if (regs.has(secNum)) {
          regs.set(secNum, {
            start: Math.min(vStart, regs.get(secNum)?.start as number),
            end: Math.max(vEnd, regs.get(secNum)?.end as number),
          });
        } else {
          regs.set(secNum, { start: vStart, end: vEnd });
        }
      }
      const dx = ix + 1; // account for header
      if (dx < dlen) {
        let row = dataRef.current[dx].map((v) => v);
        if (row[ColName.Limits].value !== v) {
          row[ColName.Limits].value = v;
          change = true;
        }
        newData.push(row);
      } else {
        showMessage(t.unusedSegment);
        newData.push(rowCells([v, t.unused, '', `${i}`]));
        change = true;
      }
      ix += 1;
    });
    secI.forEach((v, k) => {
      if (regs.has(k)) {
        newData[v][ColName.Limits].value = prettySegment(
          regs.get(k) as IRegion
        );
      }
    });
    for (let i = newData.length; i < dataRef.current.length; i += 1) {
      const row = dataRef.current[i].map((r) => r);
      if (row[ColName.Limits].value !== '') {
        row[ColName.Limits].value = '';
        change = true;
      }
      newData.push(row);
    }
    if (change) {
      setData(newData);
      setPastedSegments('');
      if (!init && !isChanged(wizToolId)) toolChanged(wizToolId);
    }
  };

  const handleSuffix = (e: ChangeEvent<HTMLInputElement>) => {
    setSuffix(e.target.value);
  };

  const skipSetup = (v: string) => {
    const idx = parseInt(v);
    let newData: ICell[][] = dataRef.current
      .filter((r, i) => i < idx + 1)
      .map((r) => r);
    return { idx, newData };
  };

  const handleSkip = (v: string) => () => {
    const { idx, newData } = skipSetup(v);
    const curRow = dataRef.current[idx + 1];
    newData.push(
      rowCells([curRow[ColName.Limits].value, t.unused, '', `${idx}`])
    );
    let p: ICell[] = []; // previous row
    dataRef.current
      .filter((r, i) => i > idx)
      .forEach((r, i) => {
        if (i > 0) {
          newData.push(
            rowCells([
              r[ColName.Limits].value,
              p[ColName.Ref].value,
              p[ColName.Desc].value,
              `${i + idx}`,
            ])
          );
        }
        p = r;
      });
    if (hasRef(p)) {
      newData.push(
        rowCells([
          '',
          p[ColName.Ref].value,
          p[ColName.Desc].value,
          `${dataRef.current.length}`,
        ])
      );
    }
    setData(newData);
  };

  const hasLimits = (row: ICell[]) =>
    row.length > 0 && row[ColName.Limits].value !== '';

  const handleDelete = (v: string) => () => {
    const { idx, newData } = skipSetup(v);
    let p: ICell[] = []; // previous row
    dataRef.current
      .filter((r, i) => i > idx)
      .forEach((r, i) => {
        if (i > 0) {
          newData.push(
            rowCells([
              p[ColName.Limits].value,
              r[ColName.Ref].value,
              r[ColName.Desc].value,
              p[ColName.Action].value,
            ])
          );
        }
        p = r;
      });
    if (hasLimits(p)) {
      newData.push(
        rowCells([
          p[ColName.Limits].value,
          t.unused,
          p[ColName.Desc].value,
          p[ColName.Action].value,
        ])
      );
    }
    setData(newData);
  };

  const handleValueRenderer = (cell: ICell, row: number) =>
    cell.className === 'act' && dataRef.current[row][0].value === '' ? (
      ''
    ) : cell.className === 'act' &&
      dataRef.current[row][1].value === t.unused ? (
      <IconButton onClick={handleDelete(cell.value)} title={t.deleteUnused}>
        <Delete fontSize="small" />
      </IconButton>
    ) : cell.className === 'act' ? (
      <IconButton onClick={handleSkip(cell.value)} title={t.markUnused}>
        <SkipIcon fontSize="small" />
      </IconButton>
    ) : (
      cell.value
    );

  return (
    <Box>
      <PassageDetailPlayer
        allowSegment={NamedRegions.ProjectResource}
        onSegment={handleSegment}
        suggestedSegments={pastedSegments}
      />
      <StyledPaper id="proj-res-sheet" style={heightStyle}>
        <StyledTable id="proj-res-sheet">
          <Stack direction="column" spacing={1} data-testid="proj-res-sheet">
            <Stack direction="row">
              <Box sx={{ width: widths[0] }} />
              <LightTooltip title={t.suffixTip}>
                <TextField
                  label={t.suffix}
                  variant="outlined"
                  value={suffix}
                  onChange={handleSuffix}
                />
              </LightTooltip>
              <Box sx={{ width: widths[2] }} />
            </Stack>
            <DataSheet
              data={data}
              valueRenderer={handleValueRenderer}
              onCellsChanged={handleCellsChanged}
              parsePaste={handleParsePaste}
            />
          </Stack>
        </StyledTable>
      </StyledPaper>
      <ActionRow>
        <AltButton
          id="copy-configure"
          onClick={handleCopy}
          disabled={numSegments === 0}
        >
          {t.copyToClipboard}
        </AltButton>
        <GrowingSpacer />
        <PriButton
          id="res-create"
          onClick={handleCreate}
          disabled={numSegments === 0 || savingRef.current}
        >
          {t.createResources}
        </PriButton>
        <AltButton id="res-create-cancel" onClick={handleCancel}>
          {ts.cancel}
        </AltButton>
      </ActionRow>
    </Box>
  );
};

export default ProjectResourceConfigure;
