import { useState, useEffect, useRef, useContext } from 'react';
import { useGlobal } from 'reactn';
import {
  Section,
  IPassageDetailArtifactsStrings,
  ISharedStrings,
  MediaFile,
  SectionResource,
} from '../../../model';
import {
  makeStyles,
  createStyles,
  Theme,
  IconButton,
  Button,
} from '@material-ui/core';
import SkipIcon from '@material-ui/icons/NotInterested';
import DataSheet from 'react-datasheet';
import 'react-datasheet/lib/react-datasheet.css';
import { QueryBuilder, RecordIdentity, TransformBuilder } from '@orbit/data';
import { withData } from '../../../mods/react-orbitjs';
import PassageDetailPlayer from '../PassageDetailPlayer';
import { parseRegions, IRegion } from '../../../crud/useWavesurferRegions';
import { prettySegment } from '../../../utils';
import { resourceSelector, sharedSelector } from '../../../selector';
import { shallowEqual, useSelector } from 'react-redux';
import { UnsavedContext } from '../../../context/UnsavedContext';
import { NamedRegions, updateSegments } from '../../../utils';
import { useProjectResourceSave } from './useProjectResourceSave';
import { useProjectSegmentSave } from './useProjectSegmentSave';
import { useFullReference, IInfo } from './useFullReference';
import { findRecord, related } from '../../../crud';
import { useSnackBar } from '../../../hoc/SnackBar';

const wizToolId = 'ProjResWizard';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    actions: {
      display: 'flex',
      justifyContent: 'flex-end',
    },
    button: { margin: theme.spacing(2) },
    para: { margin: '6pt 0pt' },
    table: {
      padding: theme.spacing(4),
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
    },
  })
);

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

interface IRecordProps {
  sectionResources: SectionResource[];
  mediafiles: MediaFile[];
  // artifactTypes: ArtifactType[];
  // categories: ArtifactCategory[]; // used by resourceRows
  // userResources: SectionResourceUser[]; // used by resourceRows
}

interface IProps extends IRecordProps {
  media: MediaFile | undefined;
  items: RecordIdentity[];
  onOpen?: (open: boolean) => void;
}

export const ProjectResourceConfigure = (props: IProps) => {
  const { media, items, onOpen, mediafiles, sectionResources } = props;
  const classes = useStyles();
  const [memory] = useGlobal('memory');
  const [, setComplete] = useGlobal('progress');
  const [data, setData] = useState<ICell[][]>([]);
  const dataRef = useRef<ICell[][]>([]);
  const infoRef = useRef<IInfo[]>([]);
  const segmentsRef = useRef('{}');
  const fullReference = useFullReference();
  const t: IPassageDetailArtifactsStrings = useSelector(
    resourceSelector,
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
    clearChanged,
    checkSavedFn,
  } = useContext(UnsavedContext).state;
  const savingRef = useRef(false);
  const projectResourceSave = useProjectResourceSave();
  const projectSegmentSave = useProjectSegmentSave();
  const { showMessage } = useSnackBar();

  const readOnlys = [false, true, false];
  const widths = [150, 200, 300];
  const cClass = ['lim', 'ref', 'des'];

  enum ColName {
    Limits,
    Ref,
    Desc,
  }

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

  useEffect(() => {
    let newData: ICell[][] = [
      rowCells([t.startStop, t.reference, t.description], true),
    ];
    const newInfo = items.map((v) => {
      const rec = memory.cache.query((q) => q.findRecord(v));
      const secRec = (
        v.type === 'passage'
          ? findRecord(memory, 'section', related(rec, 'section'))
          : rec
      ) as Section | undefined;
      return { rec, secNum: secRec?.attributes?.sequencenum || 0 } as IInfo;
    });
    newInfo.forEach((v) => {
      newData.push(rowCells(['', fullReference(v), '']));
    });
    infoRef.current = newInfo;
    setData(newData);
    dataRef.current = newData;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  const writeResources = async () => {
    if (!savingRef.current) {
      savingRef.current = true;
      if (media) {
        const t = new TransformBuilder();
        let ix = 0;
        const d = dataRef.current;
        const total = infoRef.current.length;
        for (let i of infoRef.current) {
          ix += 1;
          let row = d[ix];
          while (row[ColName.Ref].value === '' && ix < d.length) {
            ix += 1;
            row = d[ix];
          }
          const limitValue = row[ColName.Limits].value;
          let topic = row[ColName.Desc].value;
          if (limitValue && row[ColName.Ref].value) {
            await projectResourceSave({
              t,
              media,
              i,
              topicIn: topic,
              limitValue,
              mediafiles,
              sectionResources,
            });
          }
          setComplete(Math.min((ix * 100) / total, 100));
        }
        projectSegmentSave({ media, segments: segmentsRef.current })
          .then(() => {
            saveCompleted(wizToolId);
            savingRef.current = false;
            setComplete(0);
            onOpen && onOpen(false);
          })
          .catch((err) => {
            //so we don't come here...we go to continue/logout
            saveCompleted(wizToolId, err.message);
            savingRef.current = false;
            setComplete(0);
            onOpen && onOpen(false);
          });
      }
    }
  };

  useEffect(() => {
    if (saveRequested(wizToolId) && !savingRef.current) writeResources();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saveRequested]);

  const handleCreate = () => {
    if (!saveRequested(wizToolId)) {
      startSave(wizToolId);
    }
  };

  useEffect(() => {
    if (saveRequested(wizToolId)) handleCreate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toolsChanged]);

  const handleCancel = () => {
    checkSavedFn(() => {
      clearChanged(wizToolId);
      onOpen && onOpen(false);
    });
  };

  const handleCellsChanged = (changes: Array<ICellChange>) => {
    const newData = dataRef.current.map((r) => r);
    changes.forEach((c) => {
      newData[c.row][c.col].value = c.value;
    });
    setData(newData);
    dataRef.current = newData;
  };

  const fix = (regions: IRegion[]) => {
    const last = regions.length - 1;
    if (last < 0) return;
    let prev: IRegion | undefined = undefined;
    let max = 0;
    for (let i of regions) {
      max = Math.max(i.end, max);
      if (prev) prev.end = i.start;
      prev = i;
    }
    regions[last].end = max;
  };

  const d1 = (n: number) => `${Math.round(n * 10) / 10}`;

  const handleSegment = (segments: string) => {
    const regions = parseRegions(segments)
      .regions.filter((r) => d1(r.start) !== d1(r.end) && d1(r.end) !== `0.0`)
      .sort((i, j) => i.start - j.start);
    fix(regions);
    // console.log('______');
    // regions.forEach((r) => console.log(prettySegment(r)));
    segmentsRef.current = updateSegments(
      NamedRegions.ProjectResource,
      segments,
      JSON.stringify(regions)
    );
    // console.log(segmentsRef.current);
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
      while (ix < ilen && infoRef.current[ix].rec.type === 'section') {
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
        newData.push(rowCells([v, '', '']));
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
      dataRef.current = newData;
      if (!isChanged(wizToolId)) toolChanged(wizToolId);
    }
  };

  const handleSkip = (v: string) => () => {
    console.log(`skip ${v}`);
  };

  const handleValueRenderer = (cell: ICell) =>
    cell.className === 'act' ? (
      <IconButton onClick={handleSkip(cell.value)}>
        <SkipIcon fontSize="small" />
      </IconButton>
    ) : cell.className === 'ref' ? (
      <p className={classes.para}>{cell.value}</p>
    ) : (
      cell.value
    );

  return (
    <>
      <PassageDetailPlayer allowSegment={true} onSegment={handleSegment} />
      <div id="proj-res-sheet" className={classes.table}>
        <DataSheet
          data={data}
          valueRenderer={handleValueRenderer}
          onCellsChanged={handleCellsChanged}
        />
      </div>
      <div className={classes.actions}>
        <Button
          id="res-create"
          onClick={handleCreate}
          variant="contained"
          className={classes.button}
          color="primary"
          disabled={!isChanged(wizToolId)}
        >
          {t.createResources}
        </Button>
        <Button
          id="res-create-cancel"
          onClick={handleCancel}
          variant="contained"
          className={classes.button}
        >
          {ts.cancel}
        </Button>
      </div>
    </>
  );
};

const mapRecordsToProps = {
  sectionResources: (q: QueryBuilder) => q.findRecords('sectionresource'),
  mediafiles: (q: QueryBuilder) => q.findRecords('mediafile'),
  // artifactTypes: (q: QueryBuilder) => q.findRecords('artifacttype'),
  // categories: (q: QueryBuilder) => q.findRecords('artifactcategory'),
  // userResources: (q: QueryBuilder) => q.findRecords('sectionresourceuser'),
};

export default withData(mapRecordsToProps)(ProjectResourceConfigure) as any;
