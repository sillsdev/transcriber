import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useGlobal } from 'reactn';
import {
  ISharedStrings,
  ITranscriptionTabStrings,
  IVerseStrings,
  MediaFileD,
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
import { NamedRegions, updateSegments } from '../../utils/namedSegments';
import { useSnackBar } from '../../hoc/SnackBar';
import { UnsavedContext } from '../../context/UnsavedContext';
import { useProjectSegmentSave } from './Internalization/useProjectSegmentSave';
import { waitForIt } from '../../utils/waitForIt';
import { JSONParse } from '../../utils/jsonParse';
import { IRegion, parseRegions } from '../../crud/useWavesurferRegions';
import { cleanClipboard } from '../../utils/cleanClipboard';
import { refMatch } from '../../utils/refMatch';

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
    '& .value-viewer': {
      textAlign: 'center',
    },
  },
  '& .ref': {
    verticalAlign: 'inherit !important',
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
  const [numSegments, setNumSegments] = useState(0);
  const [pastedSegments, setPastedSegments] = useState('');
  const [heightStyle, setHeightStyle] = useState({
    maxHeight: `${window.innerHeight - NotTable}px`,
  });
  const savingRef = useRef(false);
  const canceling = useRef(false);
  const dataRef = useRef<ICell[][]>([]);
  const segmentsRef = useRef('{}');
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

  const readOnlys = [true, true];
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
    const newData = emptyTable();
    items.forEach((v) => {
      newData.push(rowCells(['', v]));
    });
    setData(newData);
    if (segmentsRef.current) handleSegment(segmentsRef.current, true);
  };

  useEffect(() => {
    const list: string[] = [];
    parseRef(passage);
    const { startChapter, startVerse, endChapter, endVerse } =
      passage.attributes;
    const match = refMatch(passage.attributes.reference);
    let firstVerse = startVerse ?? 1;
    if (match && `${firstVerse}` !== match[2]) {
      firstVerse += 1;
      list.push(`${startChapter}:${match[2]}`);
    }
    if (startChapter === endChapter) {
      for (let i = firstVerse; i < (endVerse ?? firstVerse ?? 1); i++) {
        list.push(`${startChapter}:${i}`);
      }
      if (match) list.push(`${endChapter}:${match[3]}`);
      setupData(list);
    } else {
      import('../../assets/eng-vrs').then((module) => {
        const engVrs = new Map<string, number[]>(module.default as IVrs[]);
        const endChap1 = (engVrs.get(passage.attributes.book) ?? [])[
          (startChapter ?? 1) - 1
        ];
        for (let i = firstVerse; i <= endChap1; i++) {
          list.push(`${startChapter}:${i}`);
        }
        for (let i = 1; i < (endVerse ?? 1); i++) {
          list.push(`${endChapter}:${i}`);
        }
        if (match) list.push(`${endChapter}:${match[4]}`);
        setupData(list);
      });
    }
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

  const d3 = (d: number) => d.toFixed(3);

  const formLim = ({ start, end }: IRegion) => `${d3(start)} --> ${d3(end)}`;

  const handleSegment = (segments: string, init: boolean) => {
    const regions = parseRegions(segments).regions.sort(
      (i, j) => i.start - j.start
    );
    let change = numSegments !== regions.length;
    setNumSegments(regions.length);
    segmentsRef.current = segments;

    if (dataRef.current.length === 0) return;

    for (let i = regions.length; i < numSegments; i++) {
      if (i + 1 >= dataRef.current.length) break;
      dataRef.current[i + 1][ColName.Limits].value = '';
    }
    let newData = new Array<ICell[]>();
    newData.push(dataRef.current[0]);

    const dLen = dataRef.current.length;
    regions.forEach((r, i) => {
      if (i + 1 >= dLen) {
        newData.push(rowCells([formLim(r), '']));
        change = true;
      } else {
        const row = dataRef.current[i + 1];
        if (row[ColName.Limits].value !== formLim(r)) {
          row[ColName.Limits].value = formLim(r);
          change = true;
        }
        newData.push(row);
      }
    });

    dataRef.current.slice(newData.length).forEach((r) => newData.push(r));

    if (change) {
      setData(newData);
      setPastedSegments('');
      if (!init && !isChanged(verseToolId)) toolChanged(verseToolId);
    }
  };

  const handleValueRenderer = (cell: ICell) => cell.value;

  const handleCellsChanged = (changes: Array<ICellChange>) => {
    const newData = dataRef.current.map((r) => r);
    changes.forEach((c) => {
      newData[c.row][c.col].value = c.value;
    });
    setData(newData);
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

    showMessage('not implemented');
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

  const handleCancel = () => {
    if (savingRef.current) {
      showMessage(t.canceling);
      canceling.current = true;
      return;
    }
    checkSavedFn(() => {
      toolChanged(verseToolId, false);
      handleComplete(false);
    });
  };

  const handleSaveMarkup = () => {
    if (!saveRequested(verseToolId)) {
      startSave(verseToolId);
    }
  };

  return Boolean(mediafileId) ? (
    <Box>
      <PassageDetailPlayer
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
    </Box>
  ) : (
    <Typography variant="h2" align="center">
      {ts.noAudio}
    </Typography>
  );
}

export default PassageDetailMarkVerses;
