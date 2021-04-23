import React from 'react';
import { useGlobal } from 'reactn';
import { User } from '../model';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Checkbox from '@material-ui/core/Checkbox';
import { QueryBuilder } from '@orbit/data';
import { withData } from '../mods/react-orbitjs';
import { langName } from '../utils';
import { isElectron } from '../api-variable';
const ipc = isElectron ? require('electron').ipcRenderer : null;

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      width: '100%',
      maxWidth: 360,
      backgroundColor: theme.palette.background.paper,
    },
  })
);

interface IRecordProps {
  users: Array<User>;
}

interface IProps extends IRecordProps {
  onSetCodes?: (codes: string[]) => void;
}

export const SpellLanguagePicker = (props: IProps) => {
  const { users, onSetCodes } = props;
  const classes = useStyles();
  const [user] = useGlobal('user');
  const [checked, setChecked] = React.useState<string[]>([]);
  const [codes, setCodes] = React.useState<string[]>([]);
  const [uiLang, setUiLang] = React.useState('en');

  const handleToggle = (value: string) => () => {
    const currentIndex = checked.indexOf(value);
    const newChecked = [...checked];

    if (currentIndex === -1) {
      newChecked.push(value);
    } else {
      newChecked.splice(currentIndex, 1);
    }
    onSetCodes && onSetCodes(newChecked);
    setChecked(newChecked);
  };

  const getUiName = (value: string, ui: string) => {
    let res = langName(ui, value) || langName(ui, value.replace('-', '_'));
    if (res) return res;
    const items = value.split('-').slice(0, -1);
    return langName(ui, items.join('_'));
  };

  const getName = (value: string) => {
    return getUiName(value, uiLang) || getUiName(value, 'en');
  };

  const compare = (x: string, y: string) => {
    return getName(x) < getName(y) ? -1 : 1;
  };

  React.useEffect(() => {
    ipc?.invoke('spellLanguages').then((list) => {
      setCodes(list);
    });
    const userRec = users.filter((u) => u.id === user) as User[];
    setUiLang(userRec[0]?.attributes?.uilanguagebcp47 || 'en');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <List className={classes.root}>
      {codes.sort(compare).map((value) => {
        const labelId = `checkbox-list-label-${value}`;

        return (
          <ListItem
            key={value}
            role={undefined}
            dense
            button
            onClick={handleToggle(value)}
          >
            <ListItemIcon>
              <Checkbox
                edge="start"
                checked={checked.indexOf(value) !== -1}
                tabIndex={-1}
                disableRipple
                inputProps={{ 'aria-labelledby': labelId }}
              />
            </ListItemIcon>
            <ListItemText
              id={labelId}
              primary={`${getName(value)} (${value})`}
            />
          </ListItem>
        );
      })}
    </List>
  );
};

const mapRecordsToProps = {
  users: (q: QueryBuilder) => q.findRecords('user'),
};

export default withData(mapRecordsToProps)(SpellLanguagePicker) as any;
