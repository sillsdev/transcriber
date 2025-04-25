import {
  useState,
  useEffect,
  useContext,
  useMemo,
  MouseEventHandler,
} from 'react';
import { useGlobal } from '../context/GlobalContext';
import { shallowEqual } from 'react-redux';
import {
  IState,
  PassageD,
  Section,
  User,
  IAssignmentTableStrings,
  IActivityStateStrings,
  Role,
  ISharedStrings,
  MediaFile,
  SectionD,
} from '../model';
import { RecordIdentity } from '@orbit/records';
import { Button, Menu, MenuItem, styled } from '@mui/material';
import DropDownIcon from '@mui/icons-material/ArrowDropDown';
import { AltButton, iconMargin } from '../control';
import { useSnackBar } from '../hoc/SnackBar';
import Confirm from './AlertDialog';
import TreeGrid from './TreeGrid';
import AssignSection from './AssignSection';
import {
  related,
  sectionDescription,
  sectionCompare,
  passageCompare,
  useOrganizedBy,
  useRole,
  useSharedResRead,
  useOrgDefaults,
  orgDefaultPermissions,
} from '../crud';
import {
  TabAppBar,
  TabActions,
  PaddedBox,
  GrowingSpacer,
  FilterButton,
} from '../control';
import { ReplaceRelatedRecord, UpdateLastModifiedBy } from '../model/baseModel';
import { PlanContext } from '../context/PlanContext';
import { useOrbitData } from '../hoc/useOrbitData';
import { useSelector } from 'react-redux';
import {
  activitySelector,
  assignmentSelector,
  sharedSelector,
} from '../selector';
import { GetReference } from './AudioTab/GetReference';
import { OrganizationSchemeD } from '../model/organizationScheme';

const AssignmentDiv = styled('div')(() => ({
  display: 'flex',
  '& tr > td > div > span.MuiButtonBase-root:nth-of-type(3)': {
    visibility: 'hidden',
  },
}));

interface IRow {
  id: string;
  name: React.ReactNode;
  scheme: React.ReactNode;
  passages: string;
  parentId: string;
  sort: string;
}
const getChildRows = (row: any, rootRows: any[]) => {
  const childRows = rootRows.filter((r) => r.parentId === (row ? row.id : ''));
  return childRows.length ? childRows : null;
};

interface IProps {
  action?: (what: string, where: number[]) => boolean;
}

export function AssignmentTable(props: IProps) {
  const t: IAssignmentTableStrings = useSelector(
    assignmentSelector,
    shallowEqual
  );
  const ts: ISharedStrings = useSelector(sharedSelector, shallowEqual);
  const activityState: IActivityStateStrings = useSelector(
    activitySelector,
    shallowEqual
  );
  const allBookData = useSelector((state: IState) => state.books.bookData);
  const passages = useOrbitData<PassageD[]>('passage');
  const sections = useOrbitData<Section[]>('section');
  const mediafiles = useOrbitData<MediaFile[]>('mediafile');
  const users = useOrbitData<User[]>('user');
  const roles = useOrbitData<Role[]>('role');
  const schemes = useOrbitData<OrganizationSchemeD[]>('organizationscheme');
  const [memory] = useGlobal('memory');
  const [user] = useGlobal('user');
  const [plan] = useGlobal('plan'); //will be constant here
  const [org] = useGlobal('organization');
  const { showMessage } = useSnackBar();
  const ctx = useContext(PlanContext);
  const { flat, sectionArr } = ctx.state;
  const [data, setData] = useState(Array<IRow>());
  const [check, setCheck] = useState(Array<number>());
  const [assignMenu, setAssignMenu] = useState<HTMLButtonElement>();
  const sectionMap = new Map<number, string>(sectionArr);
  const [selectedSections, setSelectedSections] = useState<SectionD[]>([]);
  const [readOnly, setReadOnly] = useState(false);
  const [confirmAction, setConfirmAction] = useState('');
  const { getOrganizedBy } = useOrganizedBy();
  const [organizedBy] = useState(getOrganizedBy(true));
  const [refresh, setRefresh] = useState(0);
  const { getSharedResource } = useSharedResRead();
  const { getOrgDefault } = useOrgDefaults();
  const isPermission = useMemo(
    () => Boolean(getOrgDefault(orgDefaultPermissions)),
    [getOrgDefault]
  );
  const columnDefs = useMemo(
    () =>
      !flat
        ? [
            { name: 'name', title: organizedBy },
            { name: 'passages', title: ts.passages },
            { name: 'scheme', title: isPermission ? ts.scheme : ts.scheme2 },
          ]
        : [
            { name: 'name', title: organizedBy },
            { name: 'scheme', title: isPermission ? ts.scheme : ts.scheme2 },
          ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [flat, organizedBy, ts.passages, t.sectionstate, isPermission]
  );
  const [filter, setFilter] = useState(false);
  const [assignSectionVisible, setAssignSectionVisible] = useState<string>();
  const columnWidths = useMemo(
    () => [
      { columnName: 'name', width: 300 },
      { columnName: 'passages', width: flat ? 1 : 100 },
      { columnName: 'scheme', width: 200 },
    ],
    [flat]
  );
  const { userIsAdmin } = useRole();
  const orgSchemes = useMemo(() => {
    return schemes?.filter((s) => related(s, 'organization') === org);
  }, [schemes, org]);

  const handleView = (schemeId: string) => () => {
    setAssignMenu(undefined);
    setAssignSectionVisible(schemeId);
    setReadOnly(true);
  };

  const getSchemeName = (section: Section) => {
    const schemeId = related(section, 'organizationScheme');
    const scheme = schemes.find((s) => s.id === schemeId);
    return (
      <Button onClick={handleView(schemeId)}>
        {scheme?.attributes?.name ?? ''}
      </Button>
    );
  };

  const getAssignments = () => {
    let sectionRow: IRow;
    const rowData: IRow[] = [];
    const plansections = sections
      .filter(
        (s) =>
          related(s, 'plan') === plan &&
          s.attributes &&
          s.attributes.sequencenum > 0
      )
      .sort(sectionCompare);

    plansections.forEach(function (section) {
      sectionRow = {
        id: section.id as string,
        name: sectionDescription(section, sectionMap),
        scheme: getSchemeName(section),
        passages: '0', //string so we can have blank, alternatively we could format in the tree to not show on passage rows
        parentId: '',
        sort: (section.attributes?.sequencenum || 0).toFixed(2).toString(),
      };
      rowData.push(sectionRow);
      const sectionps = passages
        .filter((p) => related(p, 'section') === section.id)
        .sort(passageCompare);
      sectionRow.passages = sectionps.length.toString();
      sectionps.forEach(function (passage: PassageD) {
        var sr = getSharedResource(passage);
        rowData.push({
          id: passage.id,
          name: (
            <GetReference
              passage={[passage]}
              bookData={allBookData}
              flat={false}
              sr={sr}
            />
          ),
          scheme: '',
          passages: '',
          parentId: section.id,
        } as IRow);
      });
    });
    return rowData as Array<IRow>;
  };

  const handleMenu: MouseEventHandler<HTMLButtonElement> = (e) => {
    if (check.length === 0) {
      showMessage(t.selectRowsToAssign);
    } else {
      setAssignMenu(e.currentTarget);
    }
  };

  const handleClose = () => {
    setAssignMenu(undefined);
  };

  const handleAssignSection = (schemeId: string) => () => {
    if (check.length === 0) {
      showMessage(t.selectRowsToAssign);
    } else {
      setAssignMenu(undefined);
      setAssignSectionVisible(schemeId);
      setReadOnly(false);
    }
  };

  const handleRemoveAssignments = () => {
    if (check.length === 0) {
      showMessage(t.selectRowsToRemove);
    } else {
      let work = false;
      check.forEach((i) => {
        const row = data[i];
        // since scheme is a button, we need to check if it has children
        if (Boolean((row.scheme as any)?.props?.children)) work = true;
      });
      if (!work) {
        showMessage(t.selectRowsToRemove);
      } else {
        setConfirmAction(t.removeSec + '? (' + check.length + ')');
      }
    }
  };

  const RemoveOneAssignment = async (s: Section) => {
    await memory.update((t) => [
      ...UpdateLastModifiedBy(t, s as RecordIdentity, user),
      ...ReplaceRelatedRecord(
        t,
        s as RecordIdentity,
        'transcriber',
        'user',
        ''
      ),
      ...ReplaceRelatedRecord(t, s as RecordIdentity, 'editor', 'user', ''),
      ...ReplaceRelatedRecord(
        t,
        s as RecordIdentity,
        'organizationScheme',
        'user',
        ''
      ),
      ...UpdateLastModifiedBy(
        t,
        { type: 'plan', id: related(s, 'plan') },
        user
      ),
    ]);
  };

  const handleRemoveAssignmentsConfirmed = async () => {
    setConfirmAction('');
    for (let i = 0; i < selectedSections.length; i += 1)
      await RemoveOneAssignment(selectedSections[i]);
    setRefresh(refresh + 1);
  };
  const handleRemoveAssignmentsRefused = () => setConfirmAction('');

  const handleCheck = (checks: Array<number>) => {
    setCheck(checks);
  };

  const handleFilter = () => setFilter(!filter);

  const sortSchemes = (a: OrganizationSchemeD, b: OrganizationSchemeD) =>
    a.attributes?.name.localeCompare(b.attributes?.name);

  useEffect(() => {
    setData(getAssignments());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    plan,
    passages,
    mediafiles,
    sections,
    users,
    roles,
    activityState,
    allBookData,
    refresh,
  ]);

  useEffect(() => {
    let selected = Array<SectionD>();
    let one: any;
    check.forEach((c) => {
      one = sections.find(function (s) {
        return c < data.length ? s.id === data[c].id : undefined;
      });
      if (one !== undefined) selected.push(one);
    });
    setSelectedSections(selected);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [check, sections]);

  return (
    <AssignmentDiv id="AssignmentTable">
      <div>
        <TabAppBar position="fixed" color="default">
          <TabActions>
            {userIsAdmin && (
              <>
                <AltButton
                  id="assignAdd"
                  key="assign"
                  aria-label={t.assignSec}
                  onClick={handleMenu}
                >
                  {isPermission ? t.assignSec : t.assignSec2}
                  <DropDownIcon sx={iconMargin} />
                </AltButton>
                <AltButton
                  id="assignRem"
                  key="remove"
                  aria-label={t.removeSec}
                  onClick={handleRemoveAssignments}
                >
                  {isPermission ? t.removeSec : t.removeSec2}
                </AltButton>
              </>
            )}
            <GrowingSpacer />
            <FilterButton filter={filter} onFilter={handleFilter} />
          </TabActions>
        </TabAppBar>
        <PaddedBox>
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
            sorting={[{ columnName: 'sort', direction: 'asc' }]}
            treeColumn={'name'}
            showfilters={filter}
            showgroups={filter}
            checks={check}
            select={userIsAdmin ? handleCheck : undefined}
            canSelectRow={(row) => row?.parentId === ''}
          />
        </PaddedBox>
      </div>
      <Menu
        id="assign-menu"
        anchorEl={assignMenu}
        open={Boolean(assignMenu)}
        onClose={handleClose}
      >
        {orgSchemes
          .filter(
            (s) =>
              related(s, 'organization') === org &&
              Boolean(s?.attributes?.name?.trim())
          )
          .sort(sortSchemes)
          .map((scheme) => (
            <MenuItem
              key={scheme.id}
              onClick={handleAssignSection(scheme.id)}
              id={'assign-' + scheme.id}
            >
              {scheme.attributes?.name}
            </MenuItem>
          ))}
        <MenuItem id="add-assign" onClick={handleAssignSection('')}>
          {isPermission ? t.addScheme : t.addScheme2}
        </MenuItem>
      </Menu>
      <AssignSection
        sections={selectedSections}
        scheme={assignSectionVisible}
        visible={assignSectionVisible !== undefined}
        closeMethod={() => setAssignSectionVisible(undefined)}
        refresh={() => setRefresh(refresh + 1)}
        readOnly={readOnly}
      />
      {confirmAction !== '' ? (
        <Confirm
          text={confirmAction}
          yesResponse={handleRemoveAssignmentsConfirmed}
          noResponse={handleRemoveAssignmentsRefused}
        />
      ) : (
        <></>
      )}
    </AssignmentDiv>
  );
}

export default AssignmentTable;
