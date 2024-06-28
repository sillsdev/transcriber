import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useGlobal } from 'reactn';
import {
  ISharedStrings,
  ITranscriptionTabStrings,
  IVerseStrings,
  MediaFileD,
  Passage,
} from '../../model';
import {
  Box,
  Paper,
  PaperProps,
  Typography,
  debounce,
  styled,
} from '@mui/material';
import DataSheet from 'react-datasheet';
import usePassageDetailContext from '../../context/usePassageDetailContext';
import {
  sharedSelector,
  transcriptionTabSelector,
  verseSelector,
} from '../../selector';
import { shallowEqual, useSelector } from 'react-redux';
import { findRecord } from '../../crud/tryFindRecord';
import { parseRef } from '../../crud/passage';
import { ActionRow } from '../../control/ActionRow';
import { AltButton } from '../../control/AltButton';
import { GrowingSpacer } from '../../control/GrowingSpacer';
import { PriButton } from '../../control/PriButton';
import PassageDetailPlayer from './PassageDetailPlayer';
import {
  NamedRegions,
  updateSegments,
  getSortedRegions,
} from '../../utils/namedSegments';
import { useSnackBar } from '../../hoc/SnackBar';
import { UnsavedContext } from '../../context/UnsavedContext';
import { useProjectSegmentSave } from './Internalization/useProjectSegmentSave';
import { waitForIt } from '../../utils/waitForIt';
import { JSONParse } from '../../utils/jsonParse';
import { IRegion } from '../../crud/useWavesurferRegions';
import { cleanClipboard } from '../../utils/cleanClipboard';
import { refMatch } from '../../utils/refMatch';
import Confirm from '../AlertDialog';

const NotTable = 490;
const verseToolId = 'VerseTool';

type IVrs = [string, number[]];

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
    '& .value-viewer': { textAlign: 'center' },
  },
  '& .ref': {
    verticalAlign: 'inherit !important',
    '& .value-viewer': { textAlign: 'center' },
  },
  '& .data-grid .Err': { backgroundColor: 'orange' },
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

export interface MarkVersesProps {
  width: number;
}

export function PassageDetailMarkVerses({ width }: MarkVersesProps) {
  const {
    mediafileId,
    passage,
    currentstep,
    setStepComplete,
    setCurrentStep,
    orgWorkflowSteps,
  } = usePassageDetailContext();
  const [memory] = useGlobal('memory');
  const [, setComplete] = useGlobal('progress');
  const [globals] = useGlobal();
  const [data, setDatax] = useState<ICell[][]>([]);
  const [issues, setIssues] = useState<string[]>([]);
  const [confirm, setConfirm] = useState('');
  const [numSegments, setNumSegments] = useState(0);
  const [pastedSegments, setPastedSegments] = useState('');
  const [heightStyle, setHeightStyle] = useState({
    maxHeight: `${window.innerHeight - NotTable}px`,
  });
  const [engVrs, setEngVrs] = useState<Map<string, number[]>>(new Map());
  const savingRef = useRef(false);
  const canceling = useRef(false);
  const dataRef = useRef<ICell[][]>([]);
  const segmentsRef = useRef('{}');
  const passageRefs = useRef<string[]>([]);
  const t = useSelector(verseSelector, shallowEqual) as IVerseStrings;
  const ts: ISharedStrings = useSelector(sharedSelector, shallowEqual);
  const tt: ITranscriptionTabStrings = useSelector(
    transcriptionTabSelector,
    shallowEqual
  );
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
  const projectSegmentSave = useProjectSegmentSave();
  const { showMessage } = useSnackBar();

  const readOnlys = [true, false];
  const widths = [200, 150];
  const cClass = ['lim', 'ref'];

  enum ColName {
    Limits,
    Ref,
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

    import('../../assets/eng-vrs').then((module) => {
      setEngVrs(new Map<string, number[]>(module.default as IVrs[]));
    });

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
          className: first
            ? 'cTitle'
            : cClass[i] +
              (i === ColName.Ref && v && !refMatch(v) ? ' Err' : ''),
        } as ICell)
    );

  const emptyTable = () => [rowCells([t.startStop, t.reference], true)];

  const setData = (newData: ICell[][]) => {
    setDatax(newData);
    dataRef.current = newData;
  };

  const media = useMemo(
    () => findRecord(memory, 'mediafile', mediafileId) as MediaFileD,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mediafileId]
  );

  const setupData = (items: string[]) => {
    passageRefs.current = items;
    const newData = emptyTable();
    items.forEach((v) => {
      newData.push(rowCells(['', v]));
    });
    setData(newData);
    if (segmentsRef.current) handleSegment(segmentsRef.current, true);
  };

  const getRefs = (value: string) => {
    const refs: string[] = [];
    const psg = { attributes: { reference: value } } as Passage;
    parseRef(psg);
    const { startChapter, startVerse, endChapter, endVerse } = psg.attributes;
    const match = refMatch(psg.attributes.reference);
    let firstVerse = startVerse ?? 1;
    if (match && `${firstVerse}` !== match[2]) {
      firstVerse += 1;
      refs.push(`${startChapter}:${match[2]}`);
    }
    if (startChapter === endChapter) {
      for (let i = firstVerse; i < (endVerse ?? firstVerse ?? 1); i++) {
        refs.push(`${startChapter}:${i}`);
      }
      if (match) refs.push(`${endChapter}:${match[3] || match[2]}`);
    } else {
      const endChap1 = (engVrs.get(psg.attributes.book) ?? [])[
        (startChapter ?? 1) - 1
      ];
      for (let i = firstVerse; i <= endChap1; i++) {
        refs.push(`${startChapter}:${i}`);
      }
      for (let i = 1; i < (endVerse ?? 1); i++) {
        refs.push(`${endChapter}:${i}`);
      }
      if (match) refs.push(`${endChapter}:${match[4]}`);
    }
    return refs;
  };

  useEffect(() => {
    const refs = getRefs(passage.attributes.reference);
    setupData(refs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passage]);

  const parsedSteps = useMemo(() => {
    if (!orgWorkflowSteps) return [];
    return orgWorkflowSteps
      .sort(
        (a, b) =>
          (a.attributes.sequencenum ?? 0) - (b.attributes.sequencenum ?? 0)
      )
      .map((s, ix) => ({
        id: s.id,
        sequencenum: ix,
        tool: JSONParse(s?.attributes?.tool).tool,
        settings:
          (JSONParse(s?.attributes?.tool).settings ?? '') === ''
            ? '{}'
            : JSONParse(s?.attributes?.tool).settings,
      }));
  }, [orgWorkflowSteps]);

  const nextStep = useMemo(() => {
    if (!currentstep || !parsedSteps) return null;
    let found = false;
    for (let s of parsedSteps) {
      if (s.id === currentstep) {
        found = true;
        continue;
      }
      if (!found) continue;
      return s.id;
    }
    return null;
  }, [currentstep, parsedSteps]);

  const handleComplete = (complete: boolean) => {
    waitForIt(
      'change cleared after save',
      () => !globals.changed,
      () => false,
      200
    ).then(async () => {
      await setStepComplete(currentstep, complete);
      //is this what users want if they have next passage set?
      //do they want to transcribe the next passage...probably?
      //change this to gotoNextStep()?
      if (complete) setCurrentStep(nextStep || '');
    });
  };

  const writeResources = async () => {
    if (!savingRef.current) {
      savingRef.current = true;
      if (media) {
        if (numSegments !== 0) {
          let segs = getSortedRegions(segmentsRef.current);
          segs = segs.map((r, i) =>
            i + 1 < dataRef.current.length
              ? {
                  ...r,
                  label: dataRef.current[i + 1][ColName.Ref].value,
                }
              : { ...r, label: '' }
          );
          const regions = JSON.stringify(segs);
          segmentsRef.current = JSON.stringify({ regions });
        }
        projectSegmentSave({
          media,
          segments: updateSegments(
            NamedRegions.Verse,
            media.attributes?.segments,
            segmentsRef.current
          ),
        })
          .then(() => {
            saveCompleted(verseToolId);
          })
          .catch((err) => {
            //so we don't come here...we go to continue/logout
            saveCompleted(verseToolId, err.message);
          })
          .finally(() => {
            savingRef.current = false;
            canceling.current = false;
            setComplete(0);
            handleComplete(true);
          });
      }
    }
  };

  const collectRefs = (data: ICell[][]) => {
    let refs: string[] = [];
    data
      .filter((v, i) => i > 0)
      .forEach((v) => {
        const value = v[ColName.Ref].value;
        if (refMatch(value)) refs.push(...getRefs(value));
      });
    return refs;
  };

  const d3 = (d: number) => d.toFixed(3);

  const formLim = ({ start, end }: IRegion) => `${d3(start)} --> ${d3(end)}`;

  const handleSegment = (segments: string, init: boolean) => {
    const regions = getSortedRegions(segments);
    let change = numSegments !== regions.length;
    setNumSegments(regions.length);
    segmentsRef.current = segments;

    if (dataRef.current.length === 0) return;

    for (let i = regions.length; i < numSegments; i++) {
      if (i + 1 >= dataRef.current.length) break;
      dataRef.current[i + 1][ColName.Limits].value = '';
    }
    let newData = new Array<ICell[]>();
    newData.push(dataRef.current[0]); // copy title row

    const dLen = dataRef.current.length;
    regions.forEach((r, i) => {
      if (i + 1 >= dLen) {
        newData.push(rowCells([formLim(r), r.label ?? '']));
        change = true;
      } else {
        const refsSoFar = collectRefs(newData);
        const row = dataRef.current[i + 1];
        if (row[ColName.Limits].value !== formLim(r)) {
          row[ColName.Limits].value = formLim(r);
          change = true;
        }
        if (
          r?.label !== undefined &&
          row[ColName.Ref].value !== r.label &&
          !refsSoFar.includes(r.label)
        ) {
          row[ColName.Ref].value = r.label;
          if (!refMatch(r.label)) row[ColName.Ref].className = 'ref Err';
          change = true;
        }
        newData.push(row);
      }
    });

    const refs = collectRefs(newData);
    dataRef.current.slice(newData.length).forEach((r) => {
      if (!refs.includes(r[ColName.Ref].value)) {
        newData.push(r);
      }
    });

    if (change) {
      setData(newData);
      setPastedSegments('');
      if (!init && !isChanged(verseToolId)) toolChanged(verseToolId);
    }
  };

  const handleValueRenderer = (cell: ICell) => cell.value;

  const handleCellsChanged = (changes: Array<ICellChange>) => {
    const newData = dataRef.current.map((r) => r);
    let changed = false;
    changes.forEach((c) => {
      const value = c.value?.trim();
      if (value !== newData[c.row][c.col].value) {
        changed = true;
        if (c.col === ColName.Ref) {
          newData[c.row][c.col] = {
            ...newData[c.row][c.col],
            value,
            className: 'ref' + (c.value && !refMatch(c.value) ? ' Err' : ''),
          };
        } else {
          newData[c.row][c.col].value = value;
        }
      }
    });
    if (changed) {
      setData(newData);
      toolChanged(verseToolId);
    }
  };

  const handleParsePaste = (clipBoard: string) => {
    const rawData = cleanClipboard(clipBoard);
    if (rawData.length === 0) {
      showMessage(tt.noData.replace('{0}', t.clipboard));
      return [];
    }
    const rawWidth = rawData[0].length;
    if (![1, 2].includes(rawWidth)) {
      showMessage(t.pasteFormat);
      return [];
    }

    if (rawWidth === 1) {
      toolChanged(verseToolId);
      return rawData;
    }

    showMessage('TODO: multi-column paste not implemented');
    return [];
  };

  const handleCopy = () => {
    const config: string[] = [];
    dataRef.current
      .filter((v, i) => i > 0)
      .forEach((row) => {
        config.push(`${row[ColName.Limits].value}\t${row[ColName.Ref].value}`);
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
    else showMessage(tt.noData.replace('{0}', t.markVerses));
  };

  useEffect(() => {
    if (saveRequested(verseToolId) && !savingRef.current) writeResources();
    else if (clearRequested(verseToolId)) clearCompleted(verseToolId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toolsChanged]);

  const checkRefs = () => {
    const refs: string[] = collectRefs(dataRef.current);
    const noSegRefs = dataRef.current
      .filter((v, i) => i > 0)
      .filter((v) => v[ColName.Ref].value && !v[ColName.Limits].value)
      .map((v) => v[ColName.Ref].value);
    const noRefSegs = dataRef.current
      .filter((v, i) => i > 0)
      .some((v, i) => !v[ColName.Ref].value && v[ColName.Limits].value);
    const matchAll = refs.every((r) => refMatch(r));
    const refSet = new Set(passageRefs.current);
    const outsideRefs = new Set<string>();
    refs.forEach((r) => {
      if (refSet.has(r)) refSet.delete(r);
      else if (refMatch(r)) outsideRefs.add(r);
    });
    const issues: string[] = [];
    if (!matchAll) issues.push(t.badReferences);
    if (noSegRefs.length > 0)
      issues.push(t.noSegments.replace('{0}', noSegRefs.join(', ')));
    if (refSet.size > 0)
      issues.push(
        t.missingReferences.replace('{0}', Array.from(refSet).sort().join(', '))
      );
    if (outsideRefs.size > 0) {
      issues.push(
        t.outsideReferences.replace('{0}', Array.from(outsideRefs).join(', '))
      );
    }
    if (noRefSegs) issues.push(t.noReferences);
    return issues;
  };

  const handleCancel = () => {
    if (savingRef.current) {
      showMessage(t.canceling);
      canceling.current = true;
      return;
    }
    checkSavedFn(() => {
      toolChanged(verseToolId, false);
      handleComplete(true); // cancel advances to next step
    });
  };

  const resetSave = () => {
    setConfirm('');
    setIssues([]);
  };

  const handleNoIssueSave = () => {
    if (!saveRequested(verseToolId)) {
      startSave(verseToolId);
    }
    resetSave();
  };

  const handleSaveMarkup = () => {
    const issues = checkRefs();
    if (issues.length > 0) {
      setIssues(issues);
      setConfirm(t.issues);
    } else {
      handleNoIssueSave();
    }
  };

  return Boolean(mediafileId) ? (
    <Box>
      <PassageDetailPlayer
        data-testid="player"
        allowSegment={NamedRegions.Verse}
        onSegment={handleSegment}
        suggestedSegments={pastedSegments}
      />
      <StyledPaper style={heightStyle}>
        <StyledTable id="verse-sheet" data-testid="verse-sheet">
          <DataSheet
            data={data}
            valueRenderer={handleValueRenderer}
            onCellsChanged={handleCellsChanged}
            parsePaste={handleParsePaste}
          />
        </StyledTable>
      </StyledPaper>
      <ActionRow>
        <AltButton
          id="copy-verse-sheet"
          onClick={handleCopy}
          disabled={numSegments === 0}
        >
          {t.copyToClipboard}
        </AltButton>
        <GrowingSpacer />
        <PriButton
          id="create-mark-verse"
          onClick={handleSaveMarkup}
          disabled={
            numSegments === 0 || savingRef.current || !isChanged(verseToolId)
          }
        >
          {t.saveVerseMarkup}
        </PriButton>
        <AltButton id="cancel-mark-verse" onClick={handleCancel}>
          {ts.cancel}
        </AltButton>
      </ActionRow>
      {confirm && (
        <Confirm
          jsx={
            <ul>
              {issues.map((i, j) => (
                <li key={`i${j}`}>{i}</li>
              ))}
            </ul>
          }
          text={confirm}
          noResponse={resetSave}
          yesResponse={handleNoIssueSave}
        />
      )}
    </Box>
  ) : (
    <Typography variant="h2" align="center">
      {ts.noAudio}
    </Typography>
  );
}

export default PassageDetailMarkVerses;