import React from 'react';
import { useGlobal } from 'reactn';
import { connect } from 'react-redux';
import { IState, Group, IGroupSettingsStrings } from '../../model';
import localStrings from '../../selector/localize';
import { withData } from 'react-orbitjs';
import { QueryBuilder } from '@orbit/data';
import { FormLabel, FormControl, FormGroup } from '@material-ui/core';
import useStyles from './GroupSettingsStyles';
import Team from './Team';
import GroupProjects from './GroupProjects';

interface IStateProps {
  t: IGroupSettingsStrings;
}

interface IRecordProps {
  groups: Array<Group>;
}

interface IProps extends IStateProps, IRecordProps {}

export function GroupSettings(props: IProps) {
  const { t } = props;
  const classes = useStyles();
  const [group] = useGlobal('group');

  return (
    <div className={classes.container}>
      <div className={classes.paper}>
        <FormControl>
          <FormLabel className={classes.label}>{t.projects}</FormLabel>
          <FormGroup className={classes.group}>
            <GroupProjects />
          </FormGroup>
        </FormControl>
        <Team selectedGroup={group} detail={false} />
      </div>
    </div>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'groupSettings' }),
});

const mapRecordsToProps = {
  groups: (q: QueryBuilder) => q.findRecords('group'),
};

export default withData(mapRecordsToProps)(
  connect(mapStateToProps)(GroupSettings) as any
) as any;
