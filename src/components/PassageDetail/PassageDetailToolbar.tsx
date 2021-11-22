import { connect } from 'react-redux';
import { IPassageDetailToolbarStrings, IState } from '../../model';
import localStrings from '../../selector/localize';

interface IStateProps {
  t: IPassageDetailToolbarStrings;
}

interface IProps extends IStateProps {}

export function PassageDetailToolbar(props: IProps) {
  const { t } = props;
  return <div>{t.add}</div>;
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'passageDetailToolbar' }),
});

export default connect(mapStateToProps)(PassageDetailToolbar) as any as any;
