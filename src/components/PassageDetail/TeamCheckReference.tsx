import { connect } from 'react-redux';
import { ITeamCheckReferenceStrings, IState } from '../../model';
import localStrings from '../../selector/localize';

interface IStateProps {
  t: ITeamCheckReferenceStrings;
}

interface IProps extends IStateProps {}

export function TeamCheckReference(props: IProps) {
  const { t } = props;

  return <div>{t.reference}</div>;
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'teamCheckReference' }),
});

export default connect(mapStateToProps)(TeamCheckReference) as any as any;
