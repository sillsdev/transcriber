import { connect } from 'react-redux';
import { ITeamCheckReferenceStrings, IState } from '../../model';
import localStrings from '../../selector/localize';

interface IStateProps {
  t: ITeamCheckReferenceStrings;
}

interface IProps extends IStateProps {
  width: number;
}

export function TeamCheckReference(props: IProps) {
  const { width, t } = props;

  return (
    <div>
      <p
        style={{
          inlineSize: `${width}px`,
          overflowWrap: 'break-word',
          hyphens: 'manual',
          whiteSpace: 'normal',
        }}
      >
        {t.reference}
      </p>
    </div>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'teamCheckReference' }),
});

export default connect(mapStateToProps)(TeamCheckReference) as any as any;
