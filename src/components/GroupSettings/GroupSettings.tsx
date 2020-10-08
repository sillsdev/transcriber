import React from 'react';
import { useGlobal } from 'reactn';
import { Group } from '../../model';
import { withData } from '../../mods/react-orbitjs';
import { QueryBuilder } from '@orbit/data';
import useStyles from './GroupSettingsStyles';
import Team from './Team';

interface IRecordProps {
  groups: Array<Group>;
}

interface IProps extends IRecordProps {}

export function GroupSettings(props: IProps) {
  const classes = useStyles();
  const [group] = useGlobal('group');

  return (
    <div className={classes.container}>
      <div className={classes.paper}>
        <Team selectedGroup={group} detail={false} />
      </div>
    </div>
  );
}

const mapRecordsToProps = {
  groups: (q: QueryBuilder) => q.findRecords('group'),
};

export default withData(mapRecordsToProps)(GroupSettings) as any;
