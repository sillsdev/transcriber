import { connect } from 'react-redux';
import { IDiscussionListStrings, IState } from '../../model';
import localStrings from '../../selector/localize';

interface IStateProps {
  t: IDiscussionListStrings;
}

interface IProps extends IStateProps {}

export function DiscussionList(props: IProps) {
  const { t } = props;

  return <div> {t.title}</div>;
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'discussionList' }),
});

export default connect(mapStateToProps)(DiscussionList) as any as any;
