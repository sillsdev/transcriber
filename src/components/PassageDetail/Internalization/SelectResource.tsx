import { useEffect, useState, useContext } from 'react';
import { connect } from 'react-redux';
import { Resource, ISharedStrings, IState } from '../../../model';
import localStrings from '../../../selector/localize';
import { makeStyles, createStyles, Theme } from '@material-ui/core';
import {
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
} from '@material-ui/core';
import Checked from '@material-ui/icons/CheckBoxOutlined';
import UnChecked from '@material-ui/icons/CheckBoxOutlineBlank';
import { PassageDetailContext } from '../../../context/PassageDetailContext';

const t2 = {
  select: 'Select',
};

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    actions: {
      display: 'flex',
      justifyContent: 'flex-end',
    },
    button: { margin: theme.spacing(2) },
  })
);

interface IStateProps {
  ts: ISharedStrings;
}

interface IProps extends IStateProps {
  onSelect?: (resources: Resource[]) => void;
  onOpen?: (open: boolean) => void;
}

export const SelectResource = (props: IProps) => {
  const { onSelect, onOpen, ts } = props;
  const classes = useStyles();
  const [resource, setResouce] = useState<Resource[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const ctx = useContext(PassageDetailContext);
  const { getSharedResources } = ctx.state;

  const handleClick = (i: number) => () => {
    let newSelected = [...selected];
    const idx = selected.indexOf(i);
    if (idx !== -1) {
      newSelected.splice(idx, 1);
    } else {
      newSelected.push(i);
    }
    setSelected(newSelected);
  };

  const handleSelect = () => {
    onSelect && onSelect(resource.filter((r, i) => selected.indexOf(i) !== -1));
    onOpen && onOpen(false);
  };

  const handleCancel = () => {
    onOpen && onOpen(false);
  };

  useEffect(() => {
    getSharedResources().then((r) => setResouce(r));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div id="selectResource">
      <List>
        {resource.map((r, i) => (
          <ListItem onClick={handleClick(i)}>
            <ListItemIcon>
              {selected.indexOf(i) !== -1 ? <Checked /> : <UnChecked />}
            </ListItemIcon>
            <ListItemText
              primary={r.attributes?.reference}
              secondary={r.attributes?.originalFile}
            />
          </ListItem>
        ))}
      </List>
      <div className={classes.actions}>
        <Button
          onClick={handleSelect}
          variant="contained"
          className={classes.button}
        >
          {t2.select}
        </Button>
        <Button
          onClick={handleCancel}
          variant="contained"
          className={classes.button}
        >
          {ts.cancel}
        </Button>
      </div>
    </div>
  );
};

const mapStateToProps = (state: IState): IStateProps => ({
  ts: localStrings(state, { layout: 'shared' }),
});

export default connect(mapStateToProps)(SelectResource) as any as any;
