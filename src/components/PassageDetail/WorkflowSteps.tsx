import { Typography } from '@material-ui/core';
import { connect } from 'react-redux';
import { IWorkflowStepsStrings, ISharedStrings, IState } from '../../model';
import localStrings from '../../selector/localize';

interface IStateProps {
  t: IWorkflowStepsStrings;
  ts: ISharedStrings;
}

interface IProps extends IStateProps {}

export function WorkflowSteps(props: IProps) {
  const { t, ts } = props;

  return <Typography>{'Here are my workflow steps'}</Typography>;
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'workflowSteps' }),
  ts: localStrings(state, { layout: 'shared' }),
});

export default connect(mapStateToProps)(WorkflowSteps) as any as any;
