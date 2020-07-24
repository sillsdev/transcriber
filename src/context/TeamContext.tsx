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
  IMainStrings,
} from '../model';
// import localStrings from '../selector/localize';
import { withData } from '../mods/react-orbitjs';
import { QueryBuilder } from '@orbit/data';
import { related, getMbrRoleRec, getMbrRole, Online } from '../utils';
import { LoadProjectData } from '../utils/loadData';
import localStrings from '../selector/localize';
// import { related, remoteId } from '../utils';

interface IStateProps {
  lang: string;
  controlStrings: IControlStrings;
  t: IMainStrings;
}
const mapStateToProps = (state: IState): IStateProps => ({
  lang: state.strings.lang,
  controlStrings: localStrings(state, { layout: 'control' }),
  t: localStrings(state, { layout: 'main' }),
});

interface IDispatchProps {
  orbitError: typeof actions.doOrbitError;
}
const mapDispatchToProps = (dispatch: any): IDispatchProps => ({
  ...bindActionCreators(
    {
      orbitError: actions.doOrbitError,
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
  personalProjects: () => Array<Plan>(),
  teamProjects: (teamId: string) => Array<Plan>(),
  teamMembers: (teamId: string) => 0,
  selectProject: (project: Plan) => {},
  projectType: (project: Plan) => '',
  projectSections: (project: Plan) => '',
  projectDescription: (project: Plan) => '',
  projectLanguage: (project: Plan) => '',
  handleMessageReset: () => {},
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
      orbitError,
    } = props;
    const [memory] = useGlobal('memory');
    const [user] = useGlobal('user');
    // const [orgRole, setOrgRole] = useGlobal('orgRole');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_projROle, setProjRole] = useGlobal('projRole');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_project, setProject] = useGlobal('project');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [plan, setPlan] = useGlobal('plan');
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
          orbitError
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
        .filter((o) => teamMembers(o.id) > 1)
        .sort((i, j) => (i?.attributes?.name < j?.attributes?.name ? -1 : 1));
    };

    const personalProjects = () => {
      const projIds = projects
        .filter((p) => {
          const teamId = related(p, 'organization');
          return teamMembers(teamId) === 1;
        })
        .map((p) => p.id);
      return plans
        .filter((p) => projIds.includes(related(p, 'project')))
        .sort((i, j) => (i?.attributes?.name < j?.attributes?.name ? -1 : 1));
    };

    const teamProjects = (teamId: string) => {
      const projIds = projects
        .filter((p) => related(p, 'organization') === teamId)
        .map((p) => p.id);
      return plans
        .filter((p) => projIds.includes(related(p, 'project')))
        .sort((i, j) => (i?.attributes?.name < j?.attributes?.name ? -1 : 1));
    };

    const projectType = (plan: Plan) => {
      const typeId = related(plan, 'plantype');
      const typeRecs = planTypes.filter((t) => t.id === typeId);
      const planType = typeRecs[0]?.attributes?.name;
      return (
        (planType && controlStrings.getString(planType.toLowerCase())) ||
        'Training'
      );
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
