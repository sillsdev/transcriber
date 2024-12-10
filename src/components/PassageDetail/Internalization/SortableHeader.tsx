import { useSelector } from 'react-redux';
import { IPassageDetailArtifactsStrings } from '../../../model';
import { TableRow } from '.';
import { passageDetailArtifactsSelector } from '../../../selector';

export const SortableHeader = () => {
  const t: IPassageDetailArtifactsStrings = useSelector(
    passageDetailArtifactsSelector
  );
  return (
    <TableRow
      value={
        {
          playItem: t.action,
          artifactName: t.resource,
          version: t.version,
          artifactType: t?.type,
          artifactCategory: t.category,
          done: t.completed,
        } as any
      }
      header={true}
    />
  );
};

export default SortableHeader;
