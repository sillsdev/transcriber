import React, { useState } from 'react';
// see: https://upmostly.com/tutorials/how-to-use-the-usecontext-hook-in-react
import { useGlobal, useEffect } from 'reactn';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import * as actions from '../store';
import {
  IState,
  IControlStrings,
  GroupMembership,
  Project,
  Plan,
  PlanType,
  Organization,
  OrganizationMembership,
  VProject,
  IMainStrings,
  ICardsStrings,
  IVProjectStrings,
  ILanguagePickerStrings,
  ISharedStrings,
  IProjButtonsStrings,
  BookNameMap,
  BookName,
  Role,
  RoleNames,
} from '../model';
import { isElectron } from '../api-variable';
import { OptionType } from '../model';
import { withData } from '../mods/react-orbitjs';
import { QueryBuilder } from '@orbit/data';
import { Online } from '../utils';
import localStrings from '../selector/localize';
import {
  related,
  LoadProjectData,
  useFlatAdd,
  useVProjectCreate,
  useVProjectRead,
  useVProjectUpdate,
  useVProjectDelete,
  useTeamCreate,
  useTeamUpdate,
  useTeamDelete,
  useIsPersonalTeam,
  useNewTeamId,
  useTableType,
  usePlan,
  useRole,
  allUsersRec,
  getRoleId,
} from '../crud';
import Auth from '../auth/Auth';
import { useSnackBar } from '../hoc/SnackBar';

export type TeamIdType = Organization | null;

interface IStateProps {
  lang: string;
  controlStrings: IControlStrings;
  t: IMainStrings;
  cardStrings: ICardsStrings;
  sharedStrings: ISharedStrings;
  vProjectStrings: IVProjectStrings;
  pickerStrings: ILanguagePickerStrings;
  projButtonStrings: IProjButtonsStrings;
  ts: ISharedStrings;
  bookSuggestions: OptionType[];
  bookMap: BookNameMap;
  allBookData: BookName[];
}
const mapStateToProps = (state: IState): IStateProps => ({
  lang: state.strings.lang,
  sharedStrings: localStrings(state, { layout: 'shared' }),
  controlStrings: localStrings(state, { layout: 'control' }),
  t: localStrings(state, { layout: 'main' }),
  cardStrings: localStrings(state, { layout: 'cards' }),
  vProjectStrings: localStrings(state, { layout: 'vProject' }),
  pickerStrings: localStrings(state, { layout: 'languagePicker' }),
  projButtonStrings: localStrings(state, { layout: 'projButtons' }),
  ts: localStrings(state, { layout: 'shared' }),
  bookSuggestions: state.books.suggestions,
  bookMap: state.books.map,
  allBookData: state.books.bookData,
});

interface IDispatchProps {
  fetchBooks: typeof actions.fetchBooks;
  doOrbitError: typeof actions.doOrbitError;
}
const mapDispatchToProps = (dispatch: any): IDispatchProps => ({
  ...bindActionCreators(
    {
      fetchBooks: actions.fetchBooks,
      doOrbitError: actions.doOrbitError,
    },
    dispatch
  ),
});

interface IRecordProps {
  organizations: Organization[];
  orgMembers: OrganizationMembership[];
  groupMemberships: GroupMembership[];
  roles: Role[];
  projects: Project[];
  plans: Plan[];
  planTypes: PlanType[];
}
const mapRecordsToProps = {
  organizations: (q: QueryBuilder) => q.findRecords('organization'),
  orgMembers: (q: QueryBuilder) => q.findRecords('organizationmembership'),
  groupMemberships: (q: QueryBuilder) => q.findRecords('groupmembership'),
  roles: (q: QueryBuilder) => q.findRecords('role'),
  projects: (q: QueryBuilder) => q.findRecords('project'),
  plans: (q: QueryBuilder) => q.findRecords('plan'),
  planTypes: (q: QueryBuilder) => q.findRecords('plantype'),
};

const initState = {
  auth: undefined as any,
  controlStrings: {} as IControlStrings,
  lang: 'en',
  bookSuggestions: Array<OptionType>(),
  bookMap: {} as BookNameMap,
  allBookData: Array<BookName>(),
  planTypes: Array<PlanType>(),
  teams: () => Array<Organization>(),
  personalProjects: () => Array<VProject>(),
  teamProjects: (teamId: string) => Array<VProject>(),
  teamMembers: (teamId: string) => 0,
  loadProject: (plan: Plan, cb: () => void) => {},
  selectProject: (project: Plan) => {},
  setProjectParams: (project: Plan) => {
    return ['', ''];
  },
  projectType: (project: Plan) => '',
  projectSections: (project: Plan) => '',
  projectDescription: (project: Plan) => '',
  projectLanguage: (project: Plan) => '',
  isOwner: (project: Plan) => false,
  projectCreate: async (project: VProject, team: TeamIdType) => '',
  projectUpdate: (project: VProject) => {},
  projectDelete: (project: VProject) => {},
  teamCreate: (team: Organization) => {},
  teamUpdate: (team: Organization) => {},
  teamDelete: (team: Organization) => {},
  isAdmin: (team: Organization) => false,
  isProjectAdmin: (team: Organization) => false,
  flatAdd: (
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
  importOpen: false,
  setImportOpen: (val: boolean) => {},
  importProject: undefined as any,
  doImport: (p: VProject | undefined = undefined) => {},
};

export type ICtxState = typeof initState & {};

interface IContext {
  state: ICtxState;
  setState: React.Dispatch<React.SetStateAction<ICtxState>>;
}

const TeamContext = React.createContext({} as IContext);

interface IProps extends IStateProps, IDispatchProps, IRecordProps {
  auth: Auth;
  children: React.ReactElement;
}

const TeamProvider = withData(mapRecordsToProps)(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )((props: IProps) => {
    const {
      auth,
      organizations,
      orgMembers,
      projects,
      groupMemberships,
      roles,
      plans,
      planTypes,
      lang,
      controlStrings,
      t,
      sharedStrings,
      cardStrings,
      vProjectStrings,
      pickerStrings,
      projButtonStrings,
      bookSuggestions,
      bookMap,
      allBookData,
      fetchBooks,
      doOrbitError,
    } = props;
    const [memory] = useGlobal('memory');
    const [isOffline] = useGlobal('offline');
    const [, setBusy] = useGlobal('importexportBusy');

    // const [orgRole, setOrgRole] = useGlobal('orgRole');
    const [, setOrganization] = useGlobal('organization');
    const [, setProject] = useGlobal('project');
    const [, setPlan] = useGlobal('plan');
    const [remote] = useGlobal('remote');
    const [backup] = useGlobal('backup');
    const [user] = useGlobal('user');
    const [projectsLoaded, setProjectsLoaded] = useGlobal('projectsLoaded');
    const [userProjects, setUserProjects] = useState(projects);
    const [userOrgs, setUserOrgs] = useState(organizations);
    const { showMessage } = useSnackBar();
    const [importOpen, setImportOpen] = useState(false);
    const [importProject, setImportProject] = useState<VProject>();
    const [state, setState] = useState({
      ...initState,
      auth,
      planTypes,
      controlStrings,
      lang,
      cardStrings,
      sharedStrings,
      vProjectStrings,
      pickerStrings,
      projButtonStrings,
    });
    const vProjectCreate = useVProjectCreate();
    const vProjectUpdate = useVProjectUpdate();
    const vProjectDelete = useVProjectDelete();
    const orbitTeamCreate = useTeamCreate({ ...props });
    const orbitTeamUpdate = useTeamUpdate();
    const orbitTeamDelete = useTeamDelete();
    const orbitFlatAdd = useFlatAdd();
    const isPersonal = useIsPersonalTeam();
    const getTeamId = useNewTeamId({ ...props });
    const getPlanType = useTableType('plan');
    const vProject = useVProjectRead();
    const { setMyProjRole, getMyProjRole, getMyOrgRole } = useRole();
    const { getPlan } = usePlan();

    const setProjectParams = (plan: Plan) => {
      const projectId = related(plan, 'project');
      const team = vProject(plan);
      const orgId = related(team, 'organization');
      setOrganization(orgId);
      setProject(projectId);
      setPlan(plan.id);
      return [projectId, orgId];
    };

    const doImport = (proj: VProject | undefined = undefined) => {
      setImportProject(proj);
      setImportOpen(true);
    };

    const loadProject = (plan: Plan, cb: () => void) => {
      selectProject(plan, cb);
    };

    const selectProject = (
      plan: Plan,
      cb: (() => void) | undefined = undefined
    ) => {
      const [projectId] = setProjectParams(plan);

      Online((online) => {
        LoadProjectData(
          projectId,
          memory,
          remote,
          online && !isOffline,
          backup,
          projectsLoaded,
          setProjectsLoaded,
          setBusy,
          doOrbitError
        )
          .then(() => {
            if (!cb) setMyProjRole(projectId);
            else cb();
          })
          .catch((err: Error) => {
            if (!online) showMessage(t.NoLoadOffline);
            else showMessage(err.message);
          });
      }, auth);
    };

    const isOwner = (plan: Plan) => {
      const projectId = related(plan, 'project');
      const role = getMyProjRole(projectId);
      return /admin/i.test(role);
    };

    const isAdmin = (org: Organization) => {
      const role = getMyOrgRole(org.id);
      return /admin/i.test(role);
    };

    const isProjectAdmin = (team: Organization) => {
      const allUsersGroup = allUsersRec(memory, team.id);
      const adminId = getRoleId(roles, RoleNames.Admin);
      if (!allUsersGroup || allUsersGroup.length === 0) return false;
      return (
        groupMemberships.filter(
          (gm) =>
            related(gm, 'group') === allUsersGroup[0].id &&
            related(gm, 'role') === adminId &&
            related(gm, 'user') === user
        ).length > 0
      );
    };

    const teamMembers = (teamId: string) => {
      const recs = orgMembers.filter(
        (o) => related(o, 'organization') === teamId
      );
      return recs.length;
    };

    const teams = () => {
      return userOrgs
        .filter(
          (o) =>
            !isPersonal(o.id) && (!isElectron || teamProjects(o.id).length > 0)
        )
        .sort((i, j) => (i?.attributes?.name < j?.attributes?.name ? -1 : 1));
    };

    const projectType = (plan: Plan) => {
      const planType = getPlanType(plan);
      return (
        (planType && controlStrings.getString(planType.toLowerCase())) ||
        'Training'
      );
    };

    const personalProjects = () => {
      const projIds = userProjects
        .filter(
          (p) =>
            isPersonal(related(p, 'organization')) &&
            (!isOffline || projectsLoaded.includes(p.id))
        )
        .map((p) => p.id);
      return plans
        .filter((p) => projIds.includes(related(p, 'project')))
        .sort((i, j) => (i?.attributes?.name < j?.attributes?.name ? -1 : 1))
        .map((p) => vProject(p));
    };

    const teamProjects = (teamId: string) => {
      const projIds = userProjects
        .filter(
          (p) =>
            related(p, 'organization') === teamId &&
            (!isOffline || projectsLoaded.includes(p.id))
        )
        .map((p) => p.id);
      return plans
        .filter((p) => projIds.includes(related(p, 'project')))
        .sort((i, j) => (i?.attributes?.name < j?.attributes?.name ? -1 : 1))
        .map((p) => vProject(p));
    };

    const projectSections = (plan: Plan) => {
      if (plan.attributes.sectionCount === undefined) {
        //only old data
        var sectionIds: string[] | null = related(plan, 'sections');
        return sectionIds ? sectionIds.length.toString() : '<na>';
      }
      return plan.attributes.sectionCount.toString();
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

    const projectUpdate = (project: VProject) => {
      vProjectUpdate(project);
    };

    const projectDelete = async (project: VProject) => {
      await vProjectDelete(project);
      setOrganization('');
      setProject('');
      setPlan('');
    };

    const teamCreate = (team: Organization) => {
      orbitTeamCreate(team);
    };

    const teamUpdate = (team: Organization) => {
      orbitTeamUpdate(team);
    };

    const teamDelete = (team: Organization) => {
      orbitTeamDelete(team);
    };

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
      if (isElectron) {
        const grpIds = groupMemberships
          .filter((gm) => related(gm, 'user') === user)
          .map((gm) => related(gm, 'group'));
        setUserProjects(
          projects.filter((p) => grpIds.includes(related(p, 'group')))
        );
      } else setUserProjects(projects);
    }, [projects, groupMemberships, user, isOffline]);

    useEffect(() => {
      if (isOffline) {
        const orgIds = orgMembers
          .filter((om) => related(om, 'user') === user)
          .map((om) => related(om, 'organization'));
        setUserOrgs(organizations.filter((o) => orgIds.includes(o.id)));
      } else {
        setUserOrgs(organizations);
      }
    }, [organizations, orgMembers, user, isOffline]);

    return (
      <TeamContext.Provider
        value={{
          state: {
            ...state,
            bookSuggestions,
            bookMap,
            allBookData,
            teams,
            personalProjects,
            teamProjects,
            teamMembers,
            projectType,
            projectSections,
            projectDescription,
            projectLanguage,
            isOwner,
            selectProject,
            loadProject,
            setProjectParams,
            projectCreate,
            projectUpdate,
            projectDelete,
            teamCreate,
            teamUpdate,
            teamDelete,
            isAdmin,
            isProjectAdmin,
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
  })
);

export { TeamContext, TeamProvider };
