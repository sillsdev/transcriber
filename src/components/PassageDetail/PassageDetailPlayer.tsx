import { Typography } from '@material-ui/core';
import { connect } from 'react-redux';
import { IPassageDetailPlayerStrings, IState } from '../../model';
import localStrings from '../../selector/localize';

interface IStateProps {
  t: IPassageDetailPlayerStrings;
}

interface IProps extends IStateProps {}

export function PassageDetailPlayer(props: IProps) {
  const { t } = props;

  return <div>{t.title}</div>;
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'passageDetailPlayer' }),
});

export default connect(mapStateToProps)(PassageDetailPlayer) as any as any;
