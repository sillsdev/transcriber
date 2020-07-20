import React, { useState } from 'react';
// see: https://upmostly.com/tutorials/how-to-use-the-usecontext-hook-in-react
import { useGlobal } from 'reactn';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
// import * as actions from '../store';
import {
  IState,
  GroupMembership,
  Project,
  Role,
  Organization,
  OrganizationMembership,
} from '../model';
// import localStrings from '../selector/localize';
import { withData } from '../mods/react-orbitjs';
import { QueryBuilder } from '@orbit/data';
import { ProjectType } from '../model';
import { related } from '../utils';
// import { related, remoteId } from '../utils';

interface IStateProps {
  lang: string;
}
const mapStateToProps = (state: IState): IStateProps => ({
  lang: state.strings.lang,
});

interface IDispatchProps {}
const mapDispatchToProps = (dispatch: any): IDispatchProps => ({
  ...bindActionCreators({}, dispatch),
});

interface IRecordProps {
  organizations: Organization[];
  orgMembers: OrganizationMembership[];
  groupMemberships: GroupMembership[];
  projects: Project[];
  projectTypes: ProjectType[];
  roles: Role[];
}
const mapRecordsToProps = {
  organizations: (q: QueryBuilder) => q.findRecords('organization'),
  orgMembers: (q: QueryBuilder) => q.findRecords('organizationmembership'),
  groupMemberships: (q: QueryBuilder) => q.findRecords('groupmembership'),
  projects: (q: QueryBuilder) => q.findRecords('project'),
  projectTypes: (q: QueryBuilder) => q.findRecords('projecttype'),
  roles: (q: QueryBuilder) => q.findRecords('role'),
};

const initState = {
  projects: Array<Project>(),
  lang: 'en',
  teams: () => Array<Organization>(),
  personalProjects: () => Array<Project>(),
  teamProjects: (teamId: string) => Array<Project>(),
  teamMembers: (teamId: string) => 0,
  selectProject: (project: Project) => {},
  projectType: (project: Project) => '',
  projectPlans: (project: Project) => '',
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
    const { organizations, orgMembers, projects, projectTypes, lang } = props;
    // const [memory] = useGlobal('memory');
    // const [user] = useGlobal('user');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_project, setProject] = useGlobal('project');
    const [state, setState] = useState({
      ...initState,
      projects,
      lang,
    });

    const selectProject = (project: Project) => {
      setProject(project.id);
      console.log('selected project: ', project?.attributes?.name);
    };

    const teamMembers = (teamId: string) => {
      const recs = orgMembers.filter(
        (o) => related(o, 'organization') === teamId
      );
      return recs.length;
    };

    const teams = () => {
      return organizations.filter((o) => teamMembers(o.id) > 1);
    };

    const personalProjects = () => {
      return projects.filter((p) => {
        const teamId = related(p, 'organization');
        return teamMembers(teamId) === 1;
      });
    };

    const teamProjects = (teamId: string) => {
      return projects.filter((p) => related(p, 'organization') === teamId);
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
