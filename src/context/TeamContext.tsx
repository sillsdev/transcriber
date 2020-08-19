import React, { useState } from 'react';
// see: https://upmostly.com/tutorials/how-to-use-the-usecontext-hook-in-react
import { useGlobal } from 'reactn';
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
} from '../model';
// import localStrings from '../selector/localize';
import { withData } from '../mods/react-orbitjs';
import { QueryBuilder } from '@orbit/data';
import { related, Online } from '../utils';
import { LoadProjectData } from '../utils/loadData';
import localStrings from '../selector/localize';
import {
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
} from '../crud';
import Auth from '../auth/Auth';
import { useFlatAdd } from '../crud/useFlatAdd';

export type TeamIdType = Organization | null;

interface IStateProps {
  lang: string;
  controlStrings: IControlStrings;
  t: IMainStrings;
  cardStrings: ICardsStrings;
  vProjectStrings: IVProjectStrings;
  pickerStrings: ILanguagePickerStrings;
  ts: ISharedStrings;
}
const mapStateToProps = (state: IState): IStateProps => ({
  lang: state.strings.lang,
  controlStrings: localStrings(state, { layout: 'control' }),
  t: localStrings(state, { layout: 'main' }),
  cardStrings: localStrings(state, { layout: 'cards' }),
  vProjectStrings: localStrings(state, { layout: 'vProject' }),
  pickerStrings: localStrings(state, { layout: 'languagePicker' }),
  ts: localStrings(state, { layout: 'shared' }),
});

interface IDispatchProps {
  doOrbitError: typeof actions.doOrbitError;
}
const mapDispatchToProps = (dispatch: any): IDispatchProps => ({
  ...bindActionCreators(
    {
      doOrbitError: actions.doOrbitError,
    },
    dispatch
  ),
});

interface IRecordProps {
  organizations: Organization[];
  orgMembers: OrganizationMembership[];
  groupMemberships: GroupMembership[];
  projects: Project[];
  plans: Plan[];
  planTypes: PlanType[];
}
const mapRecordsToProps = {
  organizations: (q: QueryBuilder) => q.findRecords('organization'),
  orgMembers: (q: QueryBuilder) => q.findRecords('organizationmembership'),
  groupMemberships: (q: QueryBuilder) => q.findRecords('groupmembership'),
  projects: (q: QueryBuilder) => q.findRecords('project'),
  plans: (q: QueryBuilder) => q.findRecords('plan'),
  planTypes: (q: QueryBuilder) => q.findRecords('plantype'),
};

const initState = {
  auth: undefined as any,
  controlStrings: {} as IControlStrings,
  lang: 'en',
  message: <></>,
  planTypes: Array<PlanType>(),
  teams: () => Array<Organization>(),
  personalProjects: () => Array<VProject>(),
  teamProjects: (teamId: string) => Array<VProject>(),
  teamMembers: (teamId: string) => 0,
  selectProject: (project: Plan) => {},
  projectType: (project: Plan) => '',
  projectSections: (project: Plan) => '',
  projectDescription: (project: Plan) => '',
  projectLanguage: (project: Plan) => '',
  handleMessageReset: () => {},
  projectCreate: async (project: VProject, team: TeamIdType) => '',
  projectUpdate: (project: VProject) => {},
  projectDelete: (project: VProject) => {},
  teamCreate: (team: Organization) => {},
  teamUpdate: (team: Organization) => {},
  teamDelete: (team: Organization) => {},
  flatAdd: (
    planId: string,
    mediaRemoteIds: string[],
    setComplete?: (amt: number) => void
  ) => {},
  cardStrings: {} as ICardsStrings,
  vProjectStrings: {} as IVProjectStrings,
  pickerStrings: {} as ILanguagePickerStrings,
};

export type ICtxState = typeof initState & {
  setMessage: React.Dispatch<React.SetStateAction<JSX.Element>>;
};

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
      plans,
      planTypes,
      lang,
      controlStrings,
      t,
      cardStrings,
      vProjectStrings,
      pickerStrings,
      doOrbitError,
    } = props;
    const [memory] = useGlobal('memory');
    // const [orgRole, setOrgRole] = useGlobal('orgRole');
    const [, setOrganization] = useGlobal('organization');
    const [, setProject] = useGlobal('project');
    const [, setPlan] = useGlobal('plan');
    const [remote] = useGlobal('remote');
    const [backup] = useGlobal('backup');
    const [projectsLoaded, setProjectsLoaded] = useGlobal('projectsLoaded');
    const [message, setMessage] = useState(<></>);
    const [state, setState] = useState({
      ...initState,
      auth,
      planTypes,
      controlStrings,
      lang,
      message,
      setMessage,
      cardStrings,
      vProjectStrings,
      pickerStrings,
    });
    const vProjectCreate = useVProjectCreate();
    const vProjectUpdate = useVProjectUpdate();
    const vProjectDelete = useVProjectDelete();
    const orbitTeamCreate = useTeamCreate({ ...props, setMessage });
    const orbitTeamUpdate = useTeamUpdate();
    const orbitTeamDelete = useTeamDelete();
    const orbitFlatAdd = useFlatAdd();
    const isPersonal = useIsPersonalTeam();
    const getTeamId = useNewTeamId({ ...props, setMessage });
    const getPlanType = useTableType('plan');
    const vProject = useVProjectRead();
    const { setMyProjRole } = useRole();
    const { getPlan } = usePlan();

    const handleMessageReset = () => {
      setMessage(<></>);
    };

    const setProjectParams = (plan: Plan) => {
      const projectId = related(plan, 'project');
      const team = vProject(plan);
      const orgId = related(team, 'organization');
      setOrganization(orgId);
      setProject(projectId);
      setPlan(plan.id);
      return [projectId, orgId];
    };

    const selectProject = (plan: Plan) => {
      const [projectId, orgId] = setProjectParams(plan);
      Online((online) => {
        LoadProjectData(
          projectId,
          memory,
          remote,
          online,
          backup,
          projectsLoaded,
          setProjectsLoaded,
          doOrbitError
        )
          .then(() => {
            setMyProjRole(orgId);
          })
          .catch((err: Error) => {
            if (!online) setMessage(<span>{t.NoLoadOffline}</span>);
            else setMessage(<span>{err.message}</span>);
          });
      });
    };

    const teamMembers = (teamId: string) => {
      const recs = orgMembers.filter(
        (o) => related(o, 'organization') === teamId
      );
      return recs.length;
    };

    const teams = () => {
      return organizations
        .filter((o) => !isPersonal(o.id))
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
      const projIds = projects
        .filter((p) => isPersonal(related(p, 'organization')))
        .map((p) => p.id);
      return plans
        .filter((p) => projIds.includes(related(p, 'project')))
        .sort((i, j) => (i?.attributes?.name < j?.attributes?.name ? -1 : 1))
        .map((p) => vProject(p));
    };

    const teamProjects = (teamId: string) => {
      const projIds = projects
        .filter((p) => related(p, 'organization') === teamId)
        .map((p) => p.id);
      return plans
        .filter((p) => projIds.includes(related(p, 'project')))
        .sort((i, j) => (i?.attributes?.name < j?.attributes?.name ? -1 : 1))
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
      const teamId = await getTeamId(team?.id);
      return await vProjectCreate(project, teamId);
    };

    const projectUpdate = (project: VProject) => {
      vProjectUpdate(project);
    };

    const projectDelete = (project: VProject) => {
      vProjectDelete(project);
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
      setComplete?: (amt: number) => void
    ) => {
      await orbitFlatAdd(planId, mediaRemoteIds, setComplete);
      const planRec = getPlan(planId);
      if (planRec) setProjectParams(planRec);
    };

    return (
      <TeamContext.Provider
        value={{
          state: {
            ...state,
            teams,
            personalProjects,
            teamProjects,
            teamMembers,
            projectType,
            projectSections,
            projectDescription,
            projectLanguage,
            selectProject,
            handleMessageReset,
            projectCreate,
            projectUpdate,
            projectDelete,
            teamCreate,
            teamUpdate,
            teamDelete,
            flatAdd,
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
