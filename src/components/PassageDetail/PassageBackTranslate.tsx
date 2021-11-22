import { connect } from 'react-redux';
import { IState } from '../../model';
import localStrings from '../../selector/localize';
import { useTheme } from '@material-ui/core';

interface IStateProps {}

interface IProps extends IStateProps {
  width: number;
}

export function PassageBackTranslate(props: IProps) {
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
          'Eventually the will allow recording or typing back translations here. For now use the Transcription tool to type the back translation.'
        }
      </p>
    </div>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'teamCheckReference' }),
});

export default connect(mapStateToProps)(PassageBackTranslate) as any as any;
