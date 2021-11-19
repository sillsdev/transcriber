import { useEffect, useState, useContext } from 'react';
import { connect } from 'react-redux';
import { Resource, ISharedStrings, IState } from '../../../model';
import localStrings from '../../../selector/localize';
import {
  makeStyles,
  createStyles,
  Theme,
  ListItemSecondaryAction,
} from '@material-ui/core';
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
import SelectCategory from '../../Workflow/SelectArtifactCategory';

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

interface SecondaryProps {
  id: string;
  fileName?: string;
  onCategory: (resId: string, catId: string) => void;
}
const Secondary = ({ id, fileName, onCategory }: SecondaryProps) => {
  const handleCategory = (catId: string) => {
    onCategory(id, catId);
  };

  return (
    <div>
      {fileName}
      <SelectCategory initCategory={''} onCategoryChange={handleCategory} />
    </div>
  );
};

export interface CatMap {
  [resId: string]: string; //map resource id to category id
}

interface IStateProps {
  ts: ISharedStrings;
}

interface IProps extends IStateProps {
  onSelect?: (resources: Resource[], catMap: CatMap) => void;
  onOpen?: (open: boolean) => void;
}

export const SelectResource = (props: IProps) => {
  const { onSelect, onOpen, ts } = props;
  const classes = useStyles();
  const [resource, setResouce] = useState<Resource[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [catMap] = useState<CatMap>({});
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
    onSelect &&
      onSelect(
        resource.filter((r, i) => selected.indexOf(i) !== -1),
        catMap
      );
    onOpen && onOpen(false);
  };

  const handleCancel = () => {
    onOpen && onOpen(false);
  };

  const handleCategory = (resId: string, catId: string) => {
    catMap[resId] = catId;
  };

  useEffect(() => {
    getSharedResources().then((res) => {
      const latest = res.filter((r) => r.attributes?.latest);
      setResouce(latest);
    });
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
            <ListItemSecondaryAction>
              <Secondary id={r.id} onCategory={handleCategory} />
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>
      <div className={classes.actions}>
        <Button
          onClick={handleSelect}
          variant="contained"
          className={classes.button}
          color="primary"
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
