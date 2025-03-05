import React from 'react';
import {
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Checkbox,
} from '@mui/material';
import { useLocLangName } from '../utils/useLocLangName';
const ipc = (window as any)?.electron;

interface IProps {
  onSetCodes?: (codes: string[]) => void;
}

export const SpellLanguagePicker = (props: IProps) => {
  const { onSetCodes } = props;
  const [checked, setChecked] = React.useState<string[]>([]);
  const [codes, setCodes] = React.useState<string[]>([]);
  const [getName, compare] = useLocLangName();

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

  React.useEffect(() => {
    ipc?.availSpellLangs().then((list: string[]) => {
      setCodes(list);
    });

    ipc?.getSpellLangs().then((list: string[]) => {
      setChecked(list);
    });

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

export default SpellLanguagePicker;
