import { useGlobal } from 'reactn';
import clsx from 'clsx';
import { makeStyles } from '@material-ui/core';
import { ListItem } from '@material-ui/core';
import { IRow } from '../../../context/PassageDetailContext';
import { DragHandle } from '.';
import { RoleNames } from '../../../model';

const useStyles = makeStyles({
  action: { minWidth: 100, textAlign: 'center' },
  resource: { minWidth: 300 },
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

  const nameParts = value.artifactName?.split('.');
  if (nameParts.length > 1) nameParts?.pop();
  const name = nameParts?.join('.');

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
        {name}
      </div>
      <div className={clsx(classes.version, { [classes.bold]: header })}>
        {value.version}
      </div>
      <div className={clsx(classes.resType, { [classes.bold]: header })}>
        {value.artifactType}
      </div>
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
