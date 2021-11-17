import { connect } from 'react-redux';
import { IPassageDetailArtifactsStrings, IState } from '../../../model';
import localStrings from '../../../selector/localize';
import { TableRow } from '.';

const t2 = {
  action: 'Action',
  resource: 'Resource',
  version: 'Version',
  type: 'Type',
  category: 'Category',
  completed: 'Completed',
};

interface IStateProps {
  t: IPassageDetailArtifactsStrings;
}

interface IProps extends IStateProps {}

export const SortableHeader = (props: IProps) => (
  <TableRow
    value={
      {
        playItem: t2.action,
        artifactName: t2.resource,
        version: t2.version,
        artifactType: t2.type,
        artifactCategory: t2.category,
        done: t2.completed,
      } as any
    }
    header={true}
  />
);

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'passageDetailArtifacts' }),
});

export default connect(mapStateToProps)(SortableHeader) as any as any;
