import * as React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { IState } from '../model/state';
import './AppNavBar.scss';
import { Typography } from '@material-ui/core'

interface IProps extends IStateProps, IDispatchProps {
};

const initialState = {
}

class AppNavBar extends React.Component<IProps, typeof initialState> {
    public state = {...initialState};

    public constructor(props: IProps) {
        super(props);
        // tslint:disable-next-line:no-console
        // console.log(this.props.users)
    }

    public render() {
        const {  } = this.props

        return (
            <div className="AppNavBar">
                <Typography>Hello World!</Typography>
            </div>
        )
    }
}

interface IStateProps {
};

const mapStateToProps = (state: IState): IStateProps => ({
});

interface IDispatchProps {
};

const mapDispatchToProps = (dispatch: any): IDispatchProps => ({
    ...bindActionCreators({
    }, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(AppNavBar);
