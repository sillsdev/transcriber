import { useState, useEffect, useMemo } from 'react';
import { useGlobal } from '../../../context/GlobalContext';
import { Column, TableColumnWidthInfo } from '@devexpress/dx-react-grid';
import { useSelector, shallowEqual } from 'react-redux';
import { passageDetailArtifactsSelector } from '../../../selector';
import {
  IState,
  Passage,
  PassageD,
  Section,
  SectionD,
  Plan,
  BookName,
  IPassageDetailArtifactsStrings,
  ISharedStrings,
} from '../../../model';
import {
  Box,
  Button,
  debounce,
  Paper,
  PaperProps,
  styled,
  Typography,
} from '@mui/material';
import TreeGrid from '../../TreeGrid';
import {
  related,
  sectionNumber,
  sectionCompare,
  passageCompare,
  passageDescText,
  useOrganizedBy,
  findRecord,
  usePlanType,
  sectionRef,
} from '../../../crud';
import { sharedSelector } from '../../../selector';
import { eqSet } from '../../../utils';
import { passageTypeFromRef } from '../../../control/RefRender';
import { PassageTypeEnum } from '../../../model/passageType';
import { RecordIdentity } from '@orbit/records';
import { useOrbitData } from '../../../hoc/useOrbitData';
import {
  projDefSectionMap,
  useProjectDefaults,
} from '../../../crud/useProjectDefaults';

const StyledPaper = styled(Paper)<PaperProps>(({ theme }) => ({
  backgroundColor: theme.palette.background.default,
  marginBottom: theme.spacing(1),
  '& .MuiPaper-rounded': {
    borderRadius: '8px',
  },
  overflow: 'auto',
  paddingTop: theme.spacing(2),
}));

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
const getSection = (
  section: Section,
  passages: Passage[],
  sectionMap: Map<number, string>,
  bookData: BookName[]
) => {
  const name =
    sectionRef(section, passages, bookData) ?? section?.attributes?.name ?? '';
  return sectionNumber(section, sectionMap) + '.\u00A0\u00A0' + name;
};

/* build the passage name = sequence + book + reference */
const getReference = (passage: Passage, bookData: BookName[] = []) => {
  return passageDescText(passage, bookData);
};

interface IProps {
  title: string;
  visual?: boolean;
  onSelect?: (items: RecordIdentity[]) => void;
}

export function SelectSections(props: IProps) {
  const { visual, title, onSelect } = props;
  const passages = useOrbitData<PassageD[]>('passage');
  const sections = useOrbitData<SectionD[]>('section');
  const [memory] = useGlobal('memory');
  const [plan] = useGlobal('plan'); //will be constant here
  const [data, setData] = useState(Array<IRow>());
  const [heightStyle, setHeightStyle] = useState({
    maxHeight: `${window.innerHeight - 250}px`,
  });
  const { getOrganizedBy } = useOrganizedBy();
  const ts: ISharedStrings = useSelector(sharedSelector, shallowEqual);
  const ta: IPassageDetailArtifactsStrings = useSelector(
    passageDetailArtifactsSelector,
    shallowEqual
  );
  const [buttonText, setButtonText] = useState(ta.projectResourceConfigure);
  const allBookData = useSelector((state: IState) => state.books.bookData);
  const [columnDefs, setColumnDefs] = useState<Column[]>([]);
  const [columnWidths, setColumnWidths] = useState<TableColumnWidthInfo[]>([]);
  const [checks, setChecks] = useState<Array<string | number>>([]);
  const { getProjectDefault } = useProjectDefaults();
  const sectionMap = new Map<number, string>(
    getProjectDefault(projDefSectionMap) ?? []
  );
  const setDimensions = () => {
    setHeightStyle({
      maxHeight: `${window.innerHeight - 250}px`,
    });
  };
  const planType = usePlanType();

  useEffect(() => {
    setButtonText(visual ? ta.createResources : ta.projectResourceConfigure);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visual]);

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

  const isFlat = useMemo(() => {
    return planType(plan)?.flat;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan]);

  useEffect(() => {
    if (!isFlat) {
      setColumnDefs(
        [
          { name: 'name', title: getOrganizedBy(true) },
          { name: 'passages', title: ts.passages },
        ].map((r) => r)
      );
      setColumnWidths(
        [
          { columnName: 'name', width: 300 },
          { columnName: 'passages', width: 120 },
        ].map((r) => r)
      );
    } else {
      setColumnDefs(
        [{ name: 'name', title: getOrganizedBy(true) }].map((r) => r)
      );
      setColumnWidths([{ columnName: 'name', width: 300 }].map((r) => r));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFlat]);

  const getSections = (
    passages: PassageD[],
    sections: SectionD[],
    bookData: BookName[]
  ) => {
    const rowData: IRow[] = [];
    sections
      .filter((s) => related(s, 'plan') === planRec?.id && s.attributes)
      .sort(sectionCompare)
      .forEach((section) => {
        const sectionpassages = passages
          .filter(
            (ps) =>
              related(ps, 'section') === section.id &&
              passageTypeFromRef(ps.attributes?.reference, isFlat) ===
                PassageTypeEnum.PASSAGE
          )
          .sort(passageCompare);
        const passageCount = sectionpassages.length;
        if (!isFlat && passageCount > 1)
          rowData.push({
            id: section.id,
            name: getSection(section, sectionpassages, sectionMap, bookData),
            passages: passageCount.toString(),
            parentId: '',
          });
        sectionpassages.forEach((passage: Passage) => {
          rowData.push({
            id: passage.id,
            name: `${sectionNumber(section, sectionMap)}.${getReference(
              passage,
              bookData
            )}`,
            passages: '',
            parentId: isFlat || passageCount === 1 ? '' : section.id,
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
          type:
            data[n].parentId === '' && !isFlat && parseInt(data[n].passages) > 1
              ? 'section'
              : 'passage',
          id: data[n].id,
        };
      }) as RecordIdentity[];
    onSelect && onSelect(results);
  };

  return (
    <Box id="SelectSections" sx={{ pt: 2, maxHeight: '70%' }}>
      <Typography variant="h6">{title}</Typography>
      <StyledPaper id="PassageList" style={heightStyle}>
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
      </StyledPaper>
      <div>
        <Button
          onClick={handleSelected}
          variant="contained"
          color="primary"
          disabled={checks.length === 0}
        >
          {buttonText}
        </Button>
      </div>
    </Box>
  );
}

export default SelectSections;
