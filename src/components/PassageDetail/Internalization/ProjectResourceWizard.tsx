import { useState, useEffect, useRef, useContext } from 'react';
import {
  Passage,
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
import { QueryBuilder, TransformBuilder } from '@orbit/data';
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
import { useFullReference } from './useFullReference';

const wizToolId = 'ProjResWizard';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    actions: {
      display: 'flex',
      justifyContent: 'flex-end',
    },
    button: { margin: theme.spacing(2) },
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
  passages: Passage[];
  onOpen?: (open: boolean) => void;
}

export const ProjectResourceWizard = (props: IProps) => {
  const { media, passages, onOpen, mediafiles, sectionResources } = props;
  const classes = useStyles();
  const [data, setData] = useState<ICell[][]>([]);
  const dataRef = useRef<ICell[][]>([]);
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

  const readOnlys = [true, false, true, false, true];
  const widths = [50, 150, 200, 300, 100];
  const cClass = ['nav', 'lim', 'ref', 'des', 'act'];

  enum ColName {
    Nav,
    Limits,
    Ref,
    Desc,
    Action,
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
      rowCells(['', t.startStop, t.reference, t.description, t.action], true),
    ];
    passages.forEach((p, i) => {
      newData.push(rowCells(['', '', fullReference(p), '', `${i}`]));
    });
    setData(newData);
    dataRef.current = newData;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passages]);

  const writeResources = async () => {
    if (!savingRef.current) {
      savingRef.current = true;
      if (media) {
        const t = new TransformBuilder();
        let ix = 0;
        const d = dataRef.current;
        for (let p of passages) {
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
              p,
              topicIn: topic,
              limitValue,
              mediafiles,
              sectionResources,
            });
          }
        }
        projectSegmentSave({ media, segments: segmentsRef.current })
          .then(() => {
            saveCompleted(wizToolId);
            savingRef.current = false;
          })
          .catch((err) => {
            //so we don't come here...we go to continue/logout
            saveCompleted(wizToolId, err.message);
            savingRef.current = false;
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

  const d1 = (n: number) => Math.round(n * 10) / 10;

  const handleSegment = (segments: string) => {
    const regions = parseRegions(segments)
      .regions.filter((r) => d1(r.start) !== d1(r.end) && d1(r.end) !== 0)
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
    regions.forEach((r, i) => {
      const v = prettySegment(r);
      const ix = i + 1;
      if (ix < dlen) {
        let row = dataRef.current[ix].map((v) => v);
        if (row[ColName.Limits].value !== v) {
          row[ColName.Limits].value = v;
          change = true;
        }
        newData.push(row);
      } else {
        newData.push(rowCells(['', v, '', '', `${i}`]));
        change = true;
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

export default withData(mapRecordsToProps)(ProjectResourceWizard) as any;
