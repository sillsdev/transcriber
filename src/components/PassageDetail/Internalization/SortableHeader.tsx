import { connect } from 'react-redux';
import { IPassageDetailArtifactsStrings, IState } from '../../../model';
import localStrings from '../../../selector/localize';
import { TableRow } from '.';

interface IStateProps {
  t: IPassageDetailArtifactsStrings;
}

interface IProps extends IStateProps {}

export const SortableHeader = ({ t }: IProps) => (
  <TableRow
    value={
      {
        playItem: t.action,
        artifactName: t.resource,
        version: t.version,
        artifactType: t.type,
        artifactCategory: t.category,
        done: t.completed,
      } as any
    }
    header={true}
  />
);

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'passageDetailArtifacts' }),
});

export default connect(mapStateToProps)(SortableHeader) as any as any;
