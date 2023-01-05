import React from 'react';
import { useGlobal } from '../mods/reactn';
import { User } from '../model';
import {
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Checkbox,
} from '@mui/material';
import { QueryBuilder } from '@orbit/data';
import { withData } from 'react-orbitjs';
import { langName } from '../utils';
const ipc = (window as any)?.electron;

interface IRecordProps {
  users: Array<User>;
}

interface IProps extends IRecordProps {
  onSetCodes?: (codes: string[]) => void;
}

export const SpellLanguagePicker = (props: IProps) => {
  const { users, onSetCodes } = props;
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
    ipc?.availSpellLangs().then((list: string[]) => {
      setCodes(list);
    });

    ipc?.getSpellLangs().then((list: string[]) => {
      setChecked(list);
    });

    const userRec = users.filter((u) => u.id === user) as User[];
    setUiLang(userRec[0]?.attributes?.locale || 'en');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <List
      sx={{ width: '100%', maxWidth: 360, backgroundColor: 'background.paper' }}
    >
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
