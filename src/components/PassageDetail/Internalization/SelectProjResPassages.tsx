import { useEffect, useState, useRef } from 'react';
import { useGlobal } from 'reactn';
import { Section, Passage, ISharedStrings, IState } from '../../../model';
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
import { sharedSelector } from '../../../selector';
import { shallowEqual, useSelector } from 'react-redux';
import { memory } from '../../../schema';
import {
  related,
  passageReference,
  findRecord,
  sectionNumber,
  passageNumber,
} from '../../../crud';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    actions: {
      display: 'flex',
      justifyContent: 'flex-end',
    },
    button: { margin: theme.spacing(2) },
    listItem: {
      margin: theme.spacing(4),
    },
  })
);

interface PassMap {
  [passId: string]: string;
}

interface IProps {
  onSelect?: (passages: Passage[]) => void;
  onOpen?: (open: boolean) => void;
}

export const SelectProjResPassages = (props: IProps) => {
  const { onSelect, onOpen } = props;
  const classes = useStyles();
  const [plan] = useGlobal('plan');
  const [passList, setPassList] = useState<Passage[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const ts: ISharedStrings = useSelector(sharedSelector, shallowEqual);
  const bookData = useSelector((state: IState) => state.books.bookData);
  const sort = useRef<PassMap>({});

  const select = (i: number, noToggle?: boolean) => {
    let newSelected = [...selected];
    const idx = selected.indexOf(i);
    if (idx !== -1) {
      if (!noToggle) newSelected.splice(idx, 1);
    } else {
      newSelected.push(i);
    }
    setSelected(newSelected);
  };

  const handleClick = (i: number) => () => {
    select(i);
  };

  const handleSelect = () => {
    onSelect && onSelect(passList.filter((r, i) => selected.indexOf(i) !== -1));
    onOpen && onOpen(false);
  };

  const handleCancel = () => {
    onOpen && onOpen(false);
  };

  const getPassList = async () => {
    const secRecs = (await memory.query((q) =>
      q.findRecords('section')
    )) as Section[];
    const secIds = secRecs
      .filter((s) => related(s, 'plan') === plan)
      .map((s) => s.id);
    const pasRecs = (await memory.query((q) =>
      q.findRecords('passage')
    )) as Passage[];
    const pass = pasRecs.filter((p) => secIds.includes(related(p, 'section')));
    pass.forEach((p) => {
      const secRec = findRecord(
        memory,
        'section',
        related(p, 'section')
      ) as Section;
      sort.current[p.id] = `${sectionNumber(secRec)}.${passageNumber(p)}`;
    });
    return pass;
  };

  useEffect(() => {
    getPassList().then((res) => {
      setPassList(res);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div id="selectResource">
      <List dense component="div">
        {passList
          .sort((i, j) => (sort.current[i.id] <= sort.current[j.id] ? -1 : 1))
          .map((r, i) => (
            <ListItem
              key={i}
              onClick={handleClick(i)}
              className={classes.listItem}
            >
              <ListItemIcon>
                {selected.indexOf(i) !== -1 ? (
                  <Checked id={`res-${i}-yes`} />
                ) : (
                  <UnChecked id={`res-${i}-no`} />
                )}
              </ListItemIcon>
              <ListItemText primary={passageReference(r, bookData)} />
            </ListItem>
          ))}
      </List>
      <div className={classes.actions}>
        <Button
          id="res-selected"
          onClick={handleSelect}
          variant="contained"
          className={classes.button}
          color="primary"
          disabled={selected.length === 0}
        >
          {ts.select}
        </Button>
        <Button
          id="res-select-cancel"
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

export default SelectProjResPassages;
