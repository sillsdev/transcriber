import * as React from 'react';
import { withStyles } from '@material-ui/core';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { withData } from 'react-orbitjs';
import { QueryBuilder, Record } from '@orbit/data';
import UserTable from './UserTable';

class UserData extends React.Component<IRecordProps, object> {
    public render(): JSX.Element {
        return <UserTable {...this.props} />
    }
}

const styles = () => ({});
const mapStateToProps = () => ({});
const mapDispatchToProps = (dispatch: any) => ({
    ...bindActionCreators({
    }, dispatch),
});

interface IRecordProps {
    users: () => Array<Record>;
}

const mapRecordsToProps = {
    users: (q: QueryBuilder) => q.findRecords('user')
}

export default withStyles(styles, { withTheme: true })(
    withData(mapRecordsToProps)(
        connect(mapStateToProps, mapDispatchToProps)(UserData) as any
        ) as any
    ) as any;
