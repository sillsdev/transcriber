import { connect } from 'react-redux';
import { IPassageDetailArtifactsStrings, IState } from '../../model';
import localStrings from '../../selector/localize';

interface IStateProps {
  t: IPassageDetailArtifactsStrings;
}

interface IProps extends IStateProps {}

export function PassageDetailArtifacts(props: IProps) {
  const { t } = props;

  return <div>{t.title}</div>;
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'passageDetailArtifacts' }),
});

export default connect(mapStateToProps)(PassageDetailArtifacts) as any as any;
