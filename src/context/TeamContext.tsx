import React, { useState, useEffect, useMemo, useRef } from 'react';
// see: https://upmostly.com/tutorials/how-to-use-the-usecontext-hook-in-react
import { useGetGlobal, useGlobal } from '../context/GlobalContext';
import { shallowEqual, useSelector } from 'react-redux';
import * as actions from '../store';
import {
  IState,
  GroupMembership,
  ProjectD,
  Plan,
  PlanD,
  PlanType,
  PlanTypeD,
  Organization,
  OrganizationD,
  OrganizationMembership,
  VProject,
  VProjectD,
  ICardsStrings,
  IVProjectStrings,
  ILanguagePickerStrings,
  ISharedStrings,
  IProjButtonsStrings,
  INewProjectStrings,
  BookNameMap,
  BookName,
  RoleNames,
  SectionD,
  SheetLevel,
} from '../model';
import { OptionType } from '../model';
import {
  related,
  useFlatAdd,
  useVProjectCreate,
  useVProjectRead,
  useVProjectUpdate,
  useVProjectDelete,
  useTeamCreate,
  useTeamUpdate,
  useTeamDelete,
  useNewTeamId,
  useTableType,
  usePlan,
  useRole,
  useOfflnProjRead,
  useLoadProjectData,
  useProjectType,
  isPersonalTeam,
  useOrganizedBy,
  findRecord,
  useOrgDefaults,
  orgDefaultProjSort,
  remoteIdGuid,
} from '../crud';
import {
  cardsSelector,
  controlSelector,
  newProjectSelector,
  pickerSelector,
  projButtonsSelector,
  sharedSelector,
  vProjectSelector,
} from '../selector';
import { useDispatch } from 'react-redux';
import { pad2, useHome } from '../utils';
import {
  RecordIdentity,
  RecordKeyMap,
  RecordOperation,
  RecordTransformBuilder,
} from '@orbit/records';
import { useOrbitData } from '../hoc/useOrbitData';
import { ReplaceRelatedRecord, UpdateLastModifiedBy } from '../model/baseModel';
import { projDefBook, useProjectDefaults } from '../crud/useProjectDefaults';
import { pad3 } from '../utils/pad3';
import {
  getKey,
  type SortArr,
  type SortMap,
} from '../components/Team/ProjectDialog/ProjectSort';

export type TeamIdType = OrganizationD | null;

const initState = {
  lang: 'en',
  ts: {} as ISharedStrings,
  resetOrbitError: (() => {}) as typeof actions.resetOrbitError,
  bookSuggestions: Array<OptionType>(),
  bookMap: {} as BookNameMap,
  allBookData: Array<BookName>(),
  planTypes: Array<PlanType>(),
  isDeleting: false,
  teams: Array<OrganizationD>(),
  personalTeam: '',
  personalProjects: Array<VProjectD>(),
  teamProjects: (teamId: string) => Array<VProjectD>(),
  teamMembers: (teamId: string) => 0,
  loadProject: (plan: PlanD, cb?: () => void) => {},
  setProjectParams: (project: PlanD) => {
    return ['', ''];
  },
  projectType: (project: Plan) => '',
  projectSections: (project: Plan) => '',
  projectDescription: (project: Plan) => '',
  projectLanguage: (project: Plan) => '',
  projectCreate: async (project: VProject, team: TeamIdType) => '',
  projectUpdate: (project: VProjectD) => {},
  projectDelete: (project: VProjectD) => {},
  teamCreate: (
    team: Organization,
    process: string,
    cb?: (org: string) => Promise<void>
  ) => {},
  teamUpdate: (team: OrganizationD) => {},
  teamDelete: async (team: RecordIdentity) => {},
  isAdmin: (team: OrganizationD) => false,
  isProjectAdmin: (team: Organization) => false,
  flatAdd: async (
    planId: string,
    mediaRemoteIds: string[],
    book: string | undefined,
    setComplete?: (amt: number) => void
  ) => {},
  cardStrings: {} as ICardsStrings,
  sharedStrings: {} as ISharedStrings,
  vProjectStrings: {} as IVProjectStrings,
  pickerStrings: {} as ILanguagePickerStrings,
  projButtonStrings: {} as IProjButtonsStrings,
  newProjectStrings: {} as INewProjectStrings,
  importOpen: false,
  setImportOpen: (val: boolean) => {},
  importProject: undefined as any,
  doImport: (p: VProject | undefined = undefined) => {},
  resetProjectPermissions: (team: string) => {},
  generalBook: (team?: string) => '000',
  updateGeneralBooks: async (arr: SortArr) => {
    // Implementation here
  },
  tab: 0,
  setTab: (tab: number) => {},
};

export type ICtxState = typeof initState & {};

interface IContext {
  state: ICtxState;
  setState: React.Dispatch<React.SetStateAction<ICtxState>>;
}

const TeamContext = React.createContext({} as IContext);

interface IProps {
  children: React.ReactElement;
}

const TeamProvider = (props: IProps) => {
  const projects = useOrbitData<ProjectD[]>('project');
  const plans = useOrbitData<PlanD[]>('plan');
  const planTypes = useOrbitData<PlanTypeD[]>('plantype');
  const organizations = useOrbitData<OrganizationD[]>('organization');
  const orgMembers = useOrbitData<OrganizationMembership[]>(
    'organizationmembership'
  );
  const groupMemberships = useOrbitData<GroupMembership[]>('groupmembership');
  const sections = useOrbitData<SectionD[]>('section');
  const ts: ISharedStrings = useSelector(sharedSelector, shallowEqual);
  const sharedStrings = ts;
  const cardStrings: ICardsStrings = useSelector(cardsSelector, shallowEqual);
  const vProjectStrings: IVProjectStrings = useSelector(
    vProjectSelector,
    shallowEqual
  );
  const pickerStrings: ILanguagePickerStrings = useSelector(
    pickerSelector,
    shallowEqual
  );
  const projButtonStrings: IProjButtonsStrings = useSelector(
    projButtonsSelector,
    shallowEqual
  );
  const newProjectStrings: INewProjectStrings = useSelector(
    newProjectSelector,
    shallowEqual
  );
  const lang = useSelector((state: IState) => state.strings.lang);
  const allBookData = useSelector((state: IState) => state.books.bookData);
  const bookMap = useSelector((state: IState) => state.books.map);
  const bookSuggestions = useSelector(
    (state: IState) => state.books.suggestions
  );
  const dispatch = useDispatch();
  const fetchBooks = (lang: string) => dispatch(actions.fetchBooks(lang));
  const resetOrbitError = () => dispatch(actions.resetOrbitError());
  const [, setOrganization] = useGlobal('organization');
  const [, setProject] = useGlobal('project');
  const [, setPlan] = useGlobal('plan');
  const [user] = useGlobal('user');
  const [memory] = useGlobal('memory');
  const [isOffline] = useGlobal('offline'); //verified this is not used in a function 2/18/25
  const [offlineOnly] = useGlobal('offlineOnly'); //will be constant here
  const [importOpen, setImportOpen] = useState(false);
  const [importProject, setImportProject] = useState<VProject>();
  const [state, setState] = useState({
    ...initState,
    lang,
    cardStrings,
    sharedStrings,
    vProjectStrings,
    pickerStrings,
    projButtonStrings,
    newProjectStrings,
    ts,
    resetOrbitError,
  });
  const controlStrings = useSelector(controlSelector, shallowEqual);
  const vProjectCreate = useVProjectCreate();
  const vProjectUpdate = useVProjectUpdate();
  const vProjectDelete = useVProjectDelete();
  const orbitTeamCreate = useTeamCreate();
  const orbitTeamUpdate = useTeamUpdate();
  const orbitTeamDelete = useTeamDelete();
  const orbitFlatAdd = useFlatAdd(sharedStrings);
  const getTeamId = useNewTeamId();
  const getPlanType = useTableType('plan');
  const vProject = useVProjectRead();
  const oProjRead = useOfflnProjRead();
  const { getMyOrgRole } = useRole();
  const { setProjectType } = useProjectType();
  const { getPlan } = usePlan();
  const LoadData = useLoadProjectData();
  const { setMyOrgRole } = useRole();
  const { resetProject } = useHome();
  const { getOrganizedBy, localizedOrganizedBy } = useOrganizedBy();
  const isMakingPersonal = useRef(false);
  const getGlobal = useGetGlobal();
  const { getProjectDefault, setProjectDefault } = useProjectDefaults();
  const { getOrgDefault } = useOrgDefaults();
  const setProjectParams = (plan: PlanD | VProjectD) => {
    const projectId = related(plan, 'project');
    const vproj = plan?.type === 'plan' ? vProject(plan) : plan;
    const orgId = related(vproj, 'organization');
    setOrganization(orgId);
    setMyOrgRole(orgId);
    setProject(projectId);
    setProjectType(projectId);
    setPlan(plan.id);
    return [projectId, orgId];
  };

  const setTab = (tab: number) => {
    setState((prev) => ({ ...prev, tab }));
  };

  const doImport = (proj: VProject | undefined = undefined) => {
    setImportProject(proj);
    setImportOpen(true);
  };

  const loadProject = (
    plan: PlanD,
    cb: (() => void) | undefined = undefined
  ) => {
    const [projectId] = setProjectParams(plan);
    LoadData(projectId, () => {
      if (cb) cb();
    });
  };

  const isAdmin = (org: OrganizationD) => {
    const role = getMyOrgRole(org.id);
    return role === RoleNames.Admin;
  };

  const teamMembers = (teamId: string) => {
    const recs = orgMembers.filter(
      (o) => related(o, 'organization') === teamId
    );
    return recs.length;
  };

  const getTeams = () => {
    let orgs = organizations;
    //online or offline we may have other user's orgs in the db
    const orgIds = orgMembers
      .filter((om) => related(om, 'user') === user)
      .map((om) => related(om, 'organization'));
    orgs = organizations.filter((o) => orgIds.includes(o.id));
    return orgs
      .filter(
        (o) =>
          !isPersonalTeam(o.id, organizations) &&
          (!getGlobal('offline') ||
            offlineOnly ||
            teamProjects(o.id).length > 0)
      )
      .sort((i, j) => (i?.attributes?.name <= j?.attributes?.name ? -1 : 1));
  };

  const projectType = (plan: Plan) => {
    const planType = getPlanType(plan);
    return (
      (planType && controlStrings.getString(planType.toLowerCase())) ||
      'Training'
    );
  };

  const generalBook = (teamId?: string) => {
    const projects = teamId ? teamProjects(teamId) : state.personalProjects;
    const bookSet = new Set(
      projects.reduce((p, c) => {
        const projId = related(c, 'project');
        const projRec = findRecord(memory, 'project', projId) as ProjectD;
        if (c.type !== 'scripture') {
          const projBook = getProjectDefault(projDefBook, projRec) as string;
          p.push(projBook || '000');
        }
        return p;
      }, Array<string>())
    );
    let newItem = bookSet.size + 10;
    while (bookSet.has(pad3(newItem))) {
      newItem += 10;
    }
    return pad3(newItem);
  };

  const updateBookSec = async (plan: PlanD, seq: number, value: string) => {
    const bookSec = sections.find(
      (s) => related(s, 'plan') === plan?.id && s.attributes.sequencenum === seq
    );
    if (bookSec) {
      await memory.update((t) =>
        t.replaceAttribute(bookSec, 'state', value).toOperation()
      );
    }
  };

  const updatePublishBook = async (proj: ProjectD, book: string) => {
    const plan = plans.find((p) => related(p, 'project') === proj.id);
    if (plan) {
      await updateBookSec(plan, -4, `BOOK ${book}`);
      await updateBookSec(plan, -3, `ALTBK ${book}`);
    }
  };

  const updateGeneralBooks = async (arr: SortArr) => {
    let preBook = '000';
    let scrBase = '0';
    arr.sort((i, j) => i[1] - j[1]); // it should already be sorted
    for (const [projId] of arr) {
      const localId =
        remoteIdGuid('project', projId, memory.keyMap as RecordKeyMap) ||
        projId;
      const proj = findRecord(memory, 'project', localId) as ProjectD;
      let book = (getProjectDefault(projDefBook, proj) as string) || '000';
      const scrBook = /^[@AB]\d{2}$/.exec(book);
      if (scrBook) {
        scrBase = book;
      } else if (book <= preBook || book.slice(0, 1) !== scrBase.slice(0, 1)) {
        let index = parseInt(preBook.slice(3) || '0');
        index += 4; // will we eventually want to insert between existing books?
        book = scrBase + pad2(index);
        setProjectDefault(projDefBook, book, proj);
        await updatePublishBook(proj, book);
      }
      preBook = book;
    }
  };

  const userProjects = useMemo(() => {
    const grpIds = groupMemberships
      .filter((gm) => related(gm, 'user') === user)
      .map((gm) => related(gm, 'group'));

    return projects.filter((p) => grpIds.includes(related(p, 'group')));
  }, [projects, groupMemberships, user]);

  // cache plan sort values to avoid recalculating
  const planSortMap = new Map<string, string>();
  const noPlan = 'Zxx';

  const planKey = (p: PlanD, map: SortMap): string => {
    if (planSortMap.has(p.id)) return planSortMap.get(p.id) || noPlan;
    const proj = findRecord(
      memory,
      'project',
      related(p, 'project')
    ) as ProjectD;
    const sortKeyInt = getKey(proj, map);
    const sortKey = sortKeyInt !== undefined ? pad3(sortKeyInt) : undefined;
    let key = sortKey ?? getProjectDefault(projDefBook, proj);
    if (key) planSortMap.set(p.id, key);
    //I suggest prepending the sort order to the plan slug
    return key ?? p?.attributes?.name ?? noPlan;
  };

  const getSortMap = (teamId?: string) => {
    let sortArr = getOrgDefault(
      orgDefaultProjSort,
      teamId ?? state.personalTeam
    ) as SortArr | undefined;
    if (!Array.isArray(sortArr)) sortArr = [];
    return new Map<string, number>(sortArr);
  };

  const planSort = (map: SortMap) => (i: PlanD, j: PlanD) => {
    const iKey = planKey(i, map);
    const jKey = planKey(j, map);
    return iKey !== jKey
      ? iKey.localeCompare(jKey)
      : i?.attributes?.name?.trim().localeCompare(j?.attributes?.name?.trim());
  };

  const teamProjects = (teamId: string) => {
    const projIds = userProjects
      .filter(
        (p) =>
          related(p, 'organization') === teamId &&
          (!getGlobal('offline') ||
            oProjRead(p.id)?.attributes?.offlineAvailable)
      )
      .map((p) => p.id);
    const sortMap = getSortMap(teamId);
    return plans
      .filter((p) => projIds.includes(related(p, 'project')))
      .sort(planSort(sortMap))
      .map((p) => vProject(p));
  };

  const projectSections = (plan: Plan) => {
    const planSections = sections.filter((s) => related(s, 'plan') === plan.id);
    if (planSections.length === 0) return '<na>';
    const status = planSections?.reduce(
      (prev, cur) => ({
        movement:
          cur.attributes?.level === SheetLevel.Movement
            ? prev.movement + 1
            : prev.movement,
        section:
          cur.attributes?.level === SheetLevel.Section &&
          cur.attributes?.sequencenum > 0
            ? prev.section + 1
            : prev.section,
      }),
      { movement: 0, section: 0 }
    );
    let msg = '';
    if (status.movement > 0)
      msg += `{0} {1}, `
        .replace('{0}', status.movement.toString())
        .replace(
          '{1}',
          status.movement === 1
            ? localizedOrganizedBy('movement', true)
            : localizedOrganizedBy('movement', false)
        );
    if (status.section > 0)
      msg += `{0} {1}`
        .replace('{0}', status.section.toString())
        .replace('{1}', getOrganizedBy(status.section === 1));
    return status.movement + status.section > 0 ? msg : '<na>';
  };

  const getProject = (plan: Plan) => {
    const projectId = related(plan, 'project');
    const projRecs = projects.filter((p) => p.id === projectId);
    if (projRecs.length > 0) return projRecs[0];
    return null;
  };

  const projectDescription = (plan: Plan) => {
    const projRec = getProject(plan);
    return projRec?.attributes?.description || '';
  };

  const projectLanguage = (plan: Plan) => {
    const projRec = getProject(plan);
    return projRec?.attributes?.languageName || 'English';
  };

  const projectCreate = async (project: VProject, team: TeamIdType) => {
    const teamId = await getTeamId(team?.id);
    return await vProjectCreate(project, teamId);
  };

  const projectUpdate = (project: VProjectD) => {
    vProjectUpdate(project);
  };

  const projectDelete = async (project: VProjectD) => {
    await vProjectDelete(project);
    resetProject();
  };

  const teamCreate = (
    team: Organization,
    process: string,
    cb?: (org: string) => Promise<void>
  ) => {
    orbitTeamCreate(team, process, cb);
  };

  const teamUpdate = (team: OrganizationD) => {
    orbitTeamUpdate(team);
  };

  const teamDelete = async (team: RecordIdentity) => {
    setState((state) => ({ ...state, isDeleting: true }));
    await orbitTeamDelete(team.id);
    setState((state) => ({ ...state, isDeleting: false }));
  };

  interface IUniqueTypes {
    [key: string]: PlanType;
  }

  const getPlanTypes = React.useMemo(() => {
    const uniqueTypes = {} as IUniqueTypes;
    planTypes.forEach((t) => {
      if (offlineOnly !== Boolean(t?.keys?.remoteId)) {
        if (t?.attributes?.name) uniqueTypes[t.attributes.name] = t;
      }
    });
    return Object.values(uniqueTypes);
  }, [offlineOnly, planTypes]);

  const flatAdd = async (
    planId: string,
    mediaRemoteIds: string[],
    book: string | undefined,
    setComplete?: (amt: number) => void
  ) => {
    await orbitFlatAdd(planId, mediaRemoteIds, book, setComplete);
    const planRec = getPlan(planId);
    if (planRec) setProjectParams(planRec);
  };

  useEffect(() => {
    if (allBookData.length === 0) fetchBooks(lang);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, allBookData]);

  useEffect(() => {
    const projIds = userProjects
      .filter(
        (p) =>
          isPersonalTeam(related(p, 'organization'), organizations) &&
          (!isOffline || oProjRead(p.id)?.attributes?.offlineAvailable)
      )
      .map((p) => p.id);
    const sortMap = getSortMap();
    const personalProjects = plans
      .filter((p) => projIds.includes(related(p, 'project')))
      .sort(planSort(sortMap))
      .map((p) =>
        vProject(
          p,
          userProjects.find((up) => up.id === related(p, 'project'))
        )
      );
    setState((state) => ({ ...state, personalProjects }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProjects, organizations, plans, isOffline]);

  useEffect(() => {
    if (!state.personalTeam && !isMakingPersonal.current) {
      isMakingPersonal.current = true;
      getTeamId(undefined).then((personalTeam: string) => {
        if (personalTeam) setState((state) => ({ ...state, personalTeam }));
      });
    }
    const teams = getTeams();
    if (JSON.stringify(teams) !== JSON.stringify(state.teams)) {
      setState((state) => ({ ...state, teams }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizations, orgMembers, user, isOffline]);

  const resetProjectPermissions = async (teamId: string) => {
    let projects = (
      memory?.cache.query((q) => q.findRecords('project')) as ProjectD[]
    ).filter((p) => related(p, 'organization') === teamId);
    var checkit = [
      'editsheetuser',
      'editsheetgroup',
      'publishuser',
      'publishgroup',
    ];
    var tb = new RecordTransformBuilder();
    var ops = [] as RecordOperation[];
    projects.forEach((p) => {
      var update = false;
      checkit.forEach((c) => {
        if (related(p, c) !== undefined) update = true;
      });
      if (update) {
        checkit.forEach((c) => {
          ops.push(
            ...ReplaceRelatedRecord(
              tb,
              p,
              c,
              c.endsWith('user') ? 'user' : 'group',
              ''
            )
          );
        });
        ops.push(...UpdateLastModifiedBy(tb, p, user));
      }
    });
    if (ops.length > 0) await memory.update(ops);
  };
  return (
    <TeamContext.Provider
      value={{
        state: {
          ...state,
          bookSuggestions,
          bookMap,
          allBookData,
          planTypes: getPlanTypes,
          teamProjects,
          teamMembers,
          projectType,
          projectSections,
          projectDescription,
          projectLanguage,
          loadProject,
          setProjectParams,
          projectCreate,
          projectUpdate,
          projectDelete,
          teamCreate,
          teamUpdate,
          teamDelete,
          isAdmin,
          flatAdd,
          importOpen,
          setImportOpen,
          importProject,
          doImport,
          resetProjectPermissions,
          generalBook,
          updateGeneralBooks,
          setTab,
        },
        setState,
      }}
    >
      {props.children}
    </TeamContext.Provider>
  );
};

export { TeamContext, TeamProvider };
