import React from 'react';
import { useGlobal } from 'reactn';
import { connect } from 'react-redux';
import { IState, Project, IGroupSettingsStrings } from '../../model';
import localStrings from '../../selector/localize';
import { withData } from 'react-orbitjs';
import { QueryBuilder } from '@orbit/data';
import { List, ListItem, ListItemText } from '@material-ui/core';
import useStyles from './GroupSettingsStyles';
import { related } from '../../utils';

interface IStateProps {
  t: IGroupSettingsStrings;
}

interface IRecordProps {
  projects: Array<Project>;
}

interface IProps extends IStateProps, IRecordProps {
  detail?: boolean;
}

export function ProjectItems(props: IProps) {
  const { detail, projects } = props;
  const [group] = useGlobal('group');

  return projects
    .filter(p => related(p, 'group') === group)
    .sort((i, j) => (i.attributes.name < j.attributes.name ? -1 : 1))
    .map(p => (
      <ListItem>
        <ListItemText
          primary={p.attributes.name}
          secondary={detail ? p.attributes.languageName : null}
        />
      </ListItem>
    ));
}

export function GroupProjects(props: IProps) {
  const { t } = props;
  const classes = useStyles();

  const projectItems = ProjectItems(props);
  return projectItems.length ? (
    <List dense={true}>{projectItems}</List>
  ) : (
    <div className={classes.noProjects}>
      <p>{t.groupExplain}</p>
      <ul>
        <li>{t.case1}</li>
        <li>{t.case2}</li>
      </ul>
    </div>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'groupSettings' }),
});

const mapRecordsToProps = {
  projects: (q: QueryBuilder) => q.findRecords('project'),
};

export default withData(mapRecordsToProps)(connect(mapStateToProps)(
  GroupProjects
) as any) as any;
