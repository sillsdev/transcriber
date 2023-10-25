import React, { useState, useEffect } from 'react';
// see: https://upmostly.com/tutorials/how-to-use-the-usecontext-hook-in-react
import { useGlobal } from 'reactn';
import { shallowEqual, useSelector } from 'react-redux';
import * as actions from '../store';
import {
  IState,
  GroupMembership,
  Project,
  Plan,
  PlanType,
  Organization,
  OrganizationMembership,
  VProject,
  ICardsStrings,
  IVProjectStrings,
  ILanguagePickerStrings,
  ISharedStrings,
  IProjButtonsStrings,
  INewProjectStrings,
  BookNameMap,
  BookName,
  RoleNames,
  Section,
} from '../model';
import { OptionType } from '../model';
import { withData } from 'react-orbitjs';
import { QueryBuilder } from '@orbit/data';
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
import { useHome } from '../utils';

export type TeamIdType = Organization | null;

interface IRecordProps {
  organizations: Organization[];
  orgMembers: OrganizationMembership[];
  groupMemberships: GroupMembership[];
  projects: Project[];
  plans: Plan[];
  planTypes: PlanType[];
  sections: Section[];
}
const mapRecordsToProps = {
  organizations: (q: QueryBuilder) => q.findRecords('organization'),
  orgMembers: (q: QueryBuilder) => q.findRecords('organizationmembership'),
  groupMemberships: (q: QueryBuilder) => q.findRecords('groupmembership'),
  projects: (q: QueryBuilder) => q.findRecords('project'),
  plans: (q: QueryBuilder) => q.findRecords('plan'),
  planTypes: (q: QueryBuilder) => q.findRecords('plantype'),
  sections: (q: QueryBuilder) => q.findRecords('section'),
};

const initState = {
  lang: 'en',
  ts: {} as ISharedStrings,
  resetOrbitError: (() => {}) as typeof actions.resetOrbitError,
  bookSuggestions: Array<OptionType>(),
  bookMap: {} as BookNameMap,
  allBookData: Array<BookName>(),
  planTypes: Array<PlanType>(),
  isDeleting: false,
  teams: Array<Organization>(),
  personalTeam: '',
  personalProjects: Array<VProject>(),
  teamProjects: (teamId: string) => Array<VProject>(),
  teamMembers: (teamId: string) => 0,
  loadProject: (plan: Plan, cb?: () => void) => {},
  setProjectParams: (project: Plan) => {
    return ['', ''];
  },
  projectType: (project: Plan) => '',
  projectSections: (project: Plan) => '',
  projectDescription: (project: Plan) => '',
  projectLanguage: (project: Plan) => '',
  projectCreate: async (project: VProject, team: TeamIdType) => '',
  projectUpdate: (project: VProject) => {},
  projectDelete: (project: VProject) => {},
  teamCreate: (
    team: Organization,
    process: string,
    cb?: (org: string) => Promise<void>
  ) => {},
  teamUpdate: (team: Organization) => {},
  teamDelete: async (team: Organization) => {},
  isAdmin: (team: Organization) => false,
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
  sections: Array<Section>(),
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

const TeamProvider = withData(mapRecordsToProps)(
  (props: IProps & IRecordProps) => {
    const {
      organizations,
      orgMembers,
      projects,
      groupMemberships,
      plans,
      planTypes,

      sections,
    } = props;
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
    const [isOffline] = useGlobal('offline');
    const [offlineOnly] = useGlobal('offlineOnly');
    const [userProjects, setUserProjects] = useState(projects);
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
      sections,
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

    const setProjectParams = (plan: Plan | VProject) => {
      const projectId = related(plan, 'project');
      const vproj = plan.type === 'plan' ? vProject(plan) : plan;
      const orgId = related(vproj, 'organization');
      setOrganization(orgId);
      setMyOrgRole(orgId);
      setProject(projectId);
      setProjectType(projectId);
      setPlan(plan.id);
      return [projectId, orgId];
    };

    const doImport = (proj: VProject | undefined = undefined) => {
      setImportProject(proj);
      setImportOpen(true);
    };

    const loadProject = (
      plan: Plan,
      cb: (() => void) | undefined = undefined
    ) => {
      const [projectId] = setProjectParams(plan);
      LoadData(projectId, () => {
        if (cb) cb();
      });
    };

    const isAdmin = (org: Organization) => {
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
            (!isOffline || offlineOnly || teamProjects(o.id).length > 0)
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
    useEffect(() => {
      const getPersonalProjects = () => {
        const projIds = userProjects
          .filter(
            (p) =>
              isPersonalTeam(related(p, 'organization'), organizations) &&
              (!isOffline || oProjRead(p.id)?.attributes?.offlineAvailable)
          )
          .map((p) => p.id);
        return plans
          .filter((p) => projIds.includes(related(p, 'project')))
          .sort((i, j) => (i?.attributes?.name <= j?.attributes?.name ? -1 : 1))
          .map((p) => vProject(p));
      };
      setState((state) => ({
        ...state,
        personalProjects: getPersonalProjects(),
      }));
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOffline, plans, userProjects]);

    const teamProjects = (teamId: string) => {
      const projIds = userProjects
        .filter(
          (p) =>
            related(p, 'organization') === teamId &&
            (!isOffline || oProjRead(p.id)?.attributes?.offlineAvailable)
        )
        .map((p) => p.id);
      return plans
        .filter((p) => projIds.includes(related(p, 'project')))
        .sort((i, j) => (i?.attributes?.name <= j?.attributes?.name ? -1 : 1))
        .map((p) => vProject(p));
    };

    const projectSections = (plan: Plan) => {
      const sectionIds: string[] | null = related(plan, 'sections');
      return sectionIds ? sectionIds.length.toString() : '<na>';
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
      console.log('TeamContext projectCreate calling getTeamId:team', team);
      const teamId = await getTeamId(team?.id);
      return await vProjectCreate(project, teamId);
    };

    const projectUpdate = (project: VProject) => {
      vProjectUpdate(project);
    };

    const projectDelete = async (project: VProject) => {
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

    const teamUpdate = (team: Organization) => {
      orbitTeamUpdate(team);
    };

    const teamDelete = async (team: Organization) => {
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
      /* after deleting a project, sometimes we get here before the projects
       ** list is updated.  So, get an updated list all the time
       */

      var projs = memory.cache.query((q: QueryBuilder) =>
        q.findRecords('project')
      ) as Project[];
      const grpIds = groupMemberships
        .filter((gm) => related(gm, 'user') === user)
        .map((gm) => related(gm, 'group'));
      setUserProjects(
        projs.filter((p) => grpIds.includes(related(p, 'group')))
      );
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projects, groupMemberships, user, isOffline]);

    useEffect(() => {
      if (!state.personalTeam) {
        getTeamId(undefined).then((personalTeam: string) => {
          console.log(`TeamContext useEffect personalTeam: ${personalTeam}`);
          if (personalTeam) setState((state) => ({ ...state, personalTeam }));
        });
      }
      setState((state) => ({
        ...state,
        teams: getTeams(),
      }));
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [organizations, orgMembers, user, isOffline]);

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
          },
          setState,
        }}
      >
        {props.children}
      </TeamContext.Provider>
    );
  }
);

export { TeamContext, TeamProvider };
