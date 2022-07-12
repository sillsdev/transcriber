import { useGlobal } from 'reactn';
import clsx from 'clsx';
import { makeStyles, Tooltip } from '@material-ui/core';
import { ListItem } from '@material-ui/core';
import { IRow } from '../../../context/PassageDetailContext';
import { DragHandle } from '.';
import { IPassageDetailArtifactsStrings, RoleNames } from '../../../model';
import { useOrganizedBy } from '../../../crud';
import { useSelector, shallowEqual } from 'react-redux';
import { resourceSelector } from '../../../selector';

const useStyles = makeStyles({
  action: { minWidth: 100, textAlign: 'center' },
  resource: { width: 300, whiteSpace: 'normal' },
  version: { minWidth: 100, textAlign: 'center' },
  resType: { minWidth: 200 },
  resCat: { minWidth: 200 },
  done: { minWidth: 100, textAlign: 'center' },
  edit: { minWidth: 100, textAlign: 'center' },
  hidden: { visibility: 'hidden' },
  bold: { fontWeight: 'bold' },
});

interface IProps {
  value: IRow;
  header?: boolean;
}

export const TableRow = ({ value, header }: IProps) => {
  const classes = useStyles();
  const [projRole] = useGlobal('projRole');
  const { getOrganizedBy } = useOrganizedBy();
  const t: IPassageDetailArtifactsStrings = useSelector(
    resourceSelector,
    shallowEqual
  );
  return (
    <ListItem>
      {projRole === RoleNames.Admin && (
        <span className={clsx({ [classes.hidden]: header })}>
          <DragHandle />
          {'\u00A0'}
        </span>
      )}
      <div className={clsx(classes.action, { [classes.bold]: header })}>
        {value.playItem}
      </div>
      <div className={clsx(classes.resource, { [classes.bold]: header })}>
        {value.artifactName}
      </div>
      <div className={clsx(classes.version, { [classes.bold]: header })}>
        {value.version}
      </div>
      <Tooltip
        title={
          Boolean(value.passageId) ? t.passageResource : getOrganizedBy(true)
        }
      >
        <div className={clsx(classes.resType, { [classes.bold]: header })}>
          {value.artifactType}
        </div>
      </Tooltip>
      <div className={clsx(classes.resCat, { [classes.bold]: header })}>
        {value.artifactCategory}
      </div>
      <div className={clsx(classes.done, { [classes.bold]: header })}>
        {value.done}
      </div>
      {projRole === RoleNames.Admin && (
        <div className={clsx(classes.edit, { [classes.bold]: header })}>
          {value.editAction}
        </div>
      )}
    </ListItem>
  );
};
