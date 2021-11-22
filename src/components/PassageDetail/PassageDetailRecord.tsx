import { connect } from 'react-redux';
import { IState } from '../../model';
import localStrings from '../../selector/localize';
import { useTheme } from '@material-ui/core';

interface IStateProps {}

interface IProps extends IStateProps {
  width: number;
}

export function PassageDetailRecord(props: IProps) {
  const { width } = props;
  const theme = useTheme();

  return (
    <div>
      <p
        style={{
          inlineSize: `${width - 10}px`,
          overflowWrap: 'break-word',
          hyphens: 'manual',
          whiteSpace: 'normal',
          margin: theme.spacing(4),
        }}
      >
        {
          'Eventually the record or upload will be here but for now, go to the Audio Project and use the upload or record (or record with Audacity) from that view.'
        }
      </p>
    </div>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'teamCheckReference' }),
});

export default connect(mapStateToProps)(PassageDetailRecord) as any as any;
