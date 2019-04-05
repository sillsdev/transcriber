import * as React from 'react';
import { withStyles } from '@material-ui/core';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { withData } from 'react-orbitjs';
import { QueryBuilder, Record } from '@orbit/data';
import OrganizationTable from './OrganizationTable';

class OrganizationData extends React.Component<IRecordProps, object> {
    public render(): JSX.Element {
        return <OrganizationTable {...this.props} />
    }
}

const styles = () => ({});
const mapStateToProps = () => ({});
const mapDispatchToProps = (dispatch: any) => ({
    ...bindActionCreators({
    }, dispatch),
});

interface IRecordProps {
    organizations: () => Array<Record>;
}

const mapRecordsToProps = {
    organizations: (q: QueryBuilder) => q.findRecords('organization')
}

export default withStyles(styles, { withTheme: true })(
    withData(mapRecordsToProps)(
        connect(mapStateToProps, mapDispatchToProps)(OrganizationData) as any
        ) as any
    ) as any;
