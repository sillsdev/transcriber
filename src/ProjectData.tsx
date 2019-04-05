import * as React from 'react';
import { withStyles } from '@material-ui/core';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { withData } from 'react-orbitjs';
import { QueryBuilder, Record } from '@orbit/data';
import ProjectTable from './ProjectTable';

class ProjectData extends React.Component<IRecordProps, object> {
    public render(): JSX.Element {
        return <ProjectTable {...this.props} />
    }
}

const styles = () => ({});
const mapStateToProps = () => ({});
const mapDispatchToProps = (dispatch: any) => ({
    ...bindActionCreators({
    }, dispatch),
});

interface IRecordProps {
    projects: () => Array<Record>;
}

const mapRecordsToProps = {
    projects: (q: QueryBuilder) => q.findRecords('project')
}

export default withStyles(styles, { withTheme: true })(
    withData(mapRecordsToProps)(
        connect(mapStateToProps, mapDispatchToProps)(ProjectData) as any
        ) as any
    ) as any;
