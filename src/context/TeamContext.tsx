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
  ISharedStrings,
} from '../model';
// import localStrings from '../selector/localize';
import { withData } from '../mods/react-orbitjs';
import { QueryBuilder } from '@orbit/data';
import { related, getMbrRoleRec, getMbrRole, Online } from '../utils';
import { LoadProjectData } from '../utils/loadData';
import localStrings from '../selector/localize';
import {
  useVProjectCreate,
  useVProjectUpdate,
  useVProjectDelete,
  useTeamCreate,
  useIsPersonalTeam,
  useNewTeamId,
} from '../crud';

export type TeamIdType = Organization | null;

interface IStateProps {
  lang: string;
  controlStrings: IControlStrings;
  t: IMainStrings;
  ts: ISharedStrings;
}
const mapStateToProps = (state: IState): IStateProps => ({
  lang: state.strings.lang,
  controlStrings: localStrings(state, { layout: 'control' }),
  t: localStrings(state, { layout: 'main' }),
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
  projectCreate: (project: VProject, team: TeamIdType) => {},
  projectUpdate: (project: VProject) => {},
  projectDelete: (project: VProject) => {},
  teamCreate: (team: Organization) => {},
};

export type ICtxState = typeof initState;

interface IContext {
  state: ICtxState;
  setState: React.Dispatch<React.SetStateAction<ICtxState>>;
}

const TeamContext = React.createContext({} as IContext);

interface IProps extends IStateProps, IDispatchProps, IRecordProps {
  children: React.ReactElement;
}

const TeamProvider = withData(mapRecordsToProps)(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )((props: IProps) => {
    const {
      organizations,
      orgMembers,
      projects,
      plans,
      planTypes,
      lang,
      controlStrings,
      t,
      doOrbitError,
    } = props;
    const [memory] = useGlobal('memory');
    const [user] = useGlobal('user');
    // const [orgRole, setOrgRole] = useGlobal('orgRole');
    const [, setProjRole] = useGlobal('projRole');
    const [, setProject] = useGlobal('project');
    const [, setPlan] = useGlobal('plan');
    const [remote] = useGlobal('remote');
    const [backup] = useGlobal('backup');
    const [projectsLoaded, setProjectsLoaded] = useGlobal('projectsLoaded');
    const [message, setMessage] = useState(<></>);
    const [state, setState] = useState({
      ...initState,
      planTypes,
      controlStrings,
      lang,
      message,
    });
    const vProjectCreate = useVProjectCreate();
    const vProjectUpdate = useVProjectUpdate();
    const vProjectDelete = useVProjectDelete();
    const orbitTeamCreate = useTeamCreate({ ...props, setMessage });
    const isPersonal = useIsPersonalTeam();
    const getTeamId = useNewTeamId({ ...props, setMessage });

    const handleMessageReset = () => {
      setMessage(<></>);
    };

    const selectProject = (plan: Plan) => {
      console.log('selected plan: ', plan?.attributes?.name);
      const projectId = related(plan, 'project');
      setProject(projectId);
      setPlan(plan.id);
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
            const projRecs = projects.filter((p) => p.id === projectId);
            if (projRecs.length > 0) {
              const groupId = related(projRecs[0], 'group');
              const roleRec = getMbrRoleRec(memory, 'group', groupId, user);
              setProjRole(getMbrRole(memory, roleRec));
            }
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

    const parseTags = (val: any) => {
      if (typeof val === 'string') {
        try {
          return JSON.parse(val);
        } catch {
          // ignore invalid json
        }
      }
      return {};
    };

    const vProject = (plan: Plan) => {
      const projectId = related(plan, 'project');
      const projectRecs = projects.filter((p) => p.id === projectId);
      if (projectRecs.length > 0) {
        return {
          ...projectRecs[0],
          ...plan,
          type: 'vproject',
          attributes: {
            ...projectRecs[0].attributes,
            ...plan.attributes,
            tags: parseTags(plan?.attributes?.tags),
            type: getPlanType(plan),
          },
          relationships: {
            ...projectRecs[0].relationships,
            ...plan.relationships,
          },
        } as VProject;
      }
      return plan as VProject;
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

    const getPlanType = (plan: Plan) => {
      const typeId = related(plan, 'plantype');
      const typeRecs = planTypes.filter((t) => t.id === typeId);
      const planType = typeRecs[0]?.attributes?.name;
      return planType ? planType.toLowerCase() : 'other';
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
      const teamId = await getTeamId(team);
      vProjectCreate(project, teamId);
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
