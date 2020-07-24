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
  Organization,
  OrganizationMembership,
  IMainStrings,
} from '../model';
// import localStrings from '../selector/localize';
import { withData } from '../mods/react-orbitjs';
import { QueryBuilder } from '@orbit/data';
import { ProjectType } from '../model';
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
  projectTypes: ProjectType[];
}
const mapRecordsToProps = {
  organizations: (q: QueryBuilder) => q.findRecords('organization'),
  orgMembers: (q: QueryBuilder) => q.findRecords('organizationmembership'),
  groupMemberships: (q: QueryBuilder) => q.findRecords('groupmembership'),
  projects: (q: QueryBuilder) => q.findRecords('project'),
  projectTypes: (q: QueryBuilder) => q.findRecords('projecttype'),
};

const initState = {
  projects: Array<Project>(),
  projectTypes: Array<ProjectType>(),
  controlStrings: {} as IControlStrings,
  lang: 'en',
  message: <></>,
  teams: () => Array<Organization>(),
  personalProjects: () => Array<Project>(),
  teamProjects: (teamId: string) => Array<Project>(),
  teamMembers: (teamId: string) => 0,
  selectProject: (project: Project) => {},
  projectType: (project: Project) => '',
  projectPlans: (project: Project) => '',
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
      projectTypes,
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
      projects,
      projectTypes,
      controlStrings,
      lang,
      message,
    });

    const handleMessageReset = () => {
      setMessage(<></>);
    };

    const selectProject = (project: Project) => {
      setProject(project.id);
      console.log('selected project: ', project?.attributes?.name);
      Online((online) => {
        LoadProjectData(
          project.id,
          memory,
          remote,
          online,
          backup,
          projectsLoaded,
          setProjectsLoaded,
          orbitError
        )
          .then(() => {
            const planRecs = (memory.cache.query((q: QueryBuilder) =>
              q.findRecords('plan')
            ) as Plan[])
              .filter((p) => related(p, 'project') === project.id)
              .sort((i, j) =>
                i?.attributes?.name < j?.attributes?.name ? -1 : 1
              );
            if (planRecs.length > 0) setPlan(planRecs[0].id);
            const groupId = related(project, 'group');
            const roleRec = getMbrRoleRec(memory, 'group', groupId, user);
            setProjRole(getMbrRole(memory, roleRec));
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
      return projects
        .filter((p) => {
          const teamId = related(p, 'organization');
          return teamMembers(teamId) === 1;
        })
        .sort((i, j) => (i?.attributes?.name < j?.attributes?.name ? -1 : 1));
    };

    const teamProjects = (teamId: string) => {
      return projects
        .filter((p) => related(p, 'organization') === teamId)
        .sort((i, j) => (i?.attributes?.name < j?.attributes?.name ? -1 : 1));
    };

    const projectType = (project: Project) => {
      const typeId = related(project, 'projecttype');
      const typeRecs = projectTypes.filter((t) => t.id === typeId);
      return typeRecs.length > 0 ? typeRecs[0]?.attributes?.name : 'Training';
    };

    const projectPlans = (project: Project) => {
      const planIds: string[] | null = related(project, 'plans');
      return planIds ? planIds.length.toString() : '<na>';
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
            projectPlans,
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
