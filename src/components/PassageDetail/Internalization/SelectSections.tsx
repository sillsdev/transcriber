import { useState, useEffect, useMemo } from 'react';
import { useGlobal } from 'reactn';
import { useSelector, shallowEqual } from 'react-redux';
import { passageDetailArtifactsSelector } from '../../../selector';
import {
  IState,
  Passage,
  Section,
  Plan,
  BookName,
  IPassageDetailArtifactsStrings,
} from '../../../model';
import { ITranscriptionTabStrings } from '../../../model';
import { withData, WithDataProps } from '../../../mods/react-orbitjs';
import { QueryBuilder, RecordIdentity } from '@orbit/data';
import { Button, debounce, Paper } from '@material-ui/core';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import TreeGrid from '../../TreeGrid';
import {
  related,
  sectionNumber,
  sectionCompare,
  passageCompare,
  passageDescription,
  useOrganizedBy,
  findRecord,
} from '../../../crud';
import { transcriptiontabSelector } from '../../../selector';
import { eqSet } from '../../../utils';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    container: {
      display: 'flex',
      flexDirection: 'column',
    },
    content: {
      paddingTop: theme.spacing(2),
      maxHeight: '70%',
    },
    root: {
      backgroundColor: theme.palette.background.default,
      marginBottom: theme.spacing(1),
      '& .MuiPaper-rounded': {
        borderRadius: '8px',
      },
      overflow: 'auto',
      paddingTop: theme.spacing(2),
    },
  })
);

interface IRow {
  id: string;
  name: string;
  passages: string;
  parentId: string;
}

const getChildRows = (row: any, rootRows: any[]) => {
  const childRows = rootRows.filter((r) => r.parentId === (row ? row.id : ''));
  return childRows.length ? childRows : null;
};

/* build the section name = sequence + name */
const getSection = (section: Section) => {
  const name =
    section && section.attributes && section.attributes.name
      ? section.attributes.name
      : '';
  return sectionNumber(section) + ' ' + name;
};

/* build the passage name = sequence + book + reference */
const getReference = (passage: Passage, bookData: BookName[] = []) => {
  return passageDescription(passage, bookData);
};

interface IRecordProps {
  passages: Array<Passage>;
  sections: Array<Section>;
}

interface IProps extends IRecordProps, WithDataProps {
  onSelect?: (items: RecordIdentity[]) => void;
}

export function SelectSections(props: IProps) {
  const { passages, sections, onSelect } = props;
  const classes = useStyles();
  const [memory] = useGlobal('memory');
  const [plan] = useGlobal('plan');
  const [data, setData] = useState(Array<IRow>());
  const [heightStyle, setHeightStyle] = useState({
    maxHeight: `${window.innerHeight - 250}px`,
  });

  const { getOrganizedBy } = useOrganizedBy();
  const t: ITranscriptionTabStrings = useSelector(
    transcriptiontabSelector,
    shallowEqual
  );
  const ta: IPassageDetailArtifactsStrings = useSelector(
    passageDetailArtifactsSelector,
    shallowEqual
  );
  const allBookData = useSelector((state: IState) => state.books.bookData);
  const columnDefs = [
    { name: 'name', title: getOrganizedBy(true) },
    { name: 'passages', title: t.passages },
  ];
  const columnWidths = [
    { columnName: 'name', width: 300 },
    { columnName: 'passages', width: 120 },
  ];
  const [checks, setChecks] = useState<Array<string | number>>([]);
  const setDimensions = () => {
    setHeightStyle({
      maxHeight: `${window.innerHeight - 250}px`,
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
  const planRec = useMemo(
    () => findRecord(memory, 'plan', plan) as Plan | undefined,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [plan]
  );
  const getSections = (
    passages: Array<Passage>,
    sections: Array<Section>,
    bookData: BookName[]
  ) => {
    const rowData: IRow[] = [];
    sections
      .filter((s) => related(s, 'plan') === planRec?.id && s.attributes)
      .sort(sectionCompare)
      .forEach((section) => {
        const sectionpassages = passages
          .filter((ps) => related(ps, 'section') === section.id)
          .sort(passageCompare);
        rowData.push({
          id: section.id,
          name: getSection(section),
          passages: sectionpassages.length.toString(),
          parentId: '',
        });
        sectionpassages.forEach((passage: Passage) => {
          rowData.push({
            id: passage.id,
            name: getReference(passage, bookData),
            passages: '',
            parentId: section.id,
          } as IRow);
        });
      });

    return rowData as Array<IRow>;
  };

  useEffect(() => {
    setData(getSections(passages, sections, allBookData));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan, passages, sections, allBookData]);

  const handleSelect = (chks: Array<string | number>) => {
    if (!eqSet(new Set(chks), new Set(checks))) {
      for (let c of chks) {
        let n = parseInt(c as string);
        if (data[n].parentId === '' && !checks.includes(n)) {
          while (++n < data.length && data[n].parentId !== '') {
            if (!chks.includes(n)) chks.push(n);
          }
        }
      }
      setChecks(chks);
    }
  };

  const handleSelected = () => {
    const results = checks
      .sort((i, j) => parseInt(i as string) - parseInt(j as string))
      .map((c) => {
        const n = parseInt(c as string);
        return {
          type: data[n].parentId === '' ? 'section' : 'passage',
          id: data[n].id,
        };
      }) as RecordIdentity[];
    onSelect && onSelect(results);
  };

  return (
    <div id="SelectSections" className={classes.content}>
      <Paper id="PassageList" className={classes.root} style={heightStyle}>
        <TreeGrid
          columns={columnDefs}
          columnWidths={columnWidths}
          rows={data}
          getChildRows={getChildRows}
          pageSizes={[]}
          tableColumnExtensions={[
            { columnName: 'passages', align: 'right' },
            { columnName: 'name', wordWrapEnabled: true },
          ]}
          groupingStateColumnExtensions={[
            { columnName: 'name', groupingEnabled: false },
            { columnName: 'passages', groupingEnabled: false },
          ]}
          sorting={[{ columnName: 'name', direction: 'asc' }]}
          treeColumn={'name'}
          showSelection={true}
          select={handleSelect}
          checks={checks}
        />
      </Paper>

      <div>
        <Button
          onClick={handleSelected}
          variant="contained"
          color="primary"
          disabled={checks.length === 0}
        >
          {ta.projectResourceConfigure}
        </Button>
      </div>
    </div>
  );
}

const mapRecordsToProps = {
  passages: (q: QueryBuilder) => q.findRecords('passage'),
  sections: (q: QueryBuilder) => q.findRecords('section'),
};

export default withData(mapRecordsToProps)(SelectSections) as any;
