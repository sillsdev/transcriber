import { useContext } from 'react';
import { connect } from 'react-redux';
import { PassageDetailContext } from '../../context/PassageDetailContext';
import { IPassageDetailToolbarStrings, IState } from '../../model';
import localStrings from '../../selector/localize';

interface IStateProps {
  t: IPassageDetailToolbarStrings;
}

interface IProps extends IStateProps {}

export function PassageDetailToolbar(props: IProps) {
  const { t } = props;
  const ctx = useContext(PassageDetailContext);
  const { getResources } = ctx.state;
  getResources().then((r) => console.log(r));
  return <div>{t.add}</div>;
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'passageDetailToolbar' }),
});

export default connect(mapStateToProps)(PassageDetailToolbar) as any as any;
