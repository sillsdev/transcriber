import {
  Checkbox,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { OptionType } from '../model';

interface IProps {
  options: OptionType[];
  value: string[];
  onChange?: (projs: string[]) => void;
}

export const BurritoOption = ({ options, value, onChange }: IProps) => {
  const [checked, setChecked] = useState<string[]>(value);

  useEffect(() => {
    setChecked(value);
  }, [value]);

  const handleToggle = (value: string) => () => {
    const currentIndex = checked.indexOf(value);
    const newChecked = [...checked];

    if (currentIndex === -1) {
      newChecked.push(value);
    } else {
      newChecked.splice(currentIndex, 1);
    }

    setChecked(newChecked);
    onChange && onChange(newChecked);
  };

  const handleAllToggle = () => {
    let newChecked: string[] = [];
    if (checked.length <= 0) {
      newChecked = options.map((p) => p.value);
    }
    setChecked(newChecked);
    onChange && onChange(newChecked);
  };

  return (
    <List dense>
      {options
        .sort((a, b) => a.label.localeCompare(b.label))
        .map((p) => {
          const labelId = `checkbox-list-label-${p.value}`;

          return (
            <ListItem key={p.value} disablePadding>
              <ListItemButton
                role={undefined}
                onClick={handleToggle(p.value)}
                dense
              >
                <ListItemIcon>
                  <Checkbox
                    edge="start"
                    checked={checked.includes(p.value)}
                    tabIndex={-1}
                    disableRipple
                    inputProps={{ 'aria-labelledby': labelId }}
                  />
                </ListItemIcon>
                <ListItemText id={labelId} primary={`${p.label}`} />
              </ListItemButton>
            </ListItem>
          );
        })}
      <Divider />
      <ListItem>
        <ListItemButton role={undefined} onClick={handleAllToggle} dense>
          <ListItemText
            id="all-toggle"
            primary={checked.length > 0 ? 'Deselect All' : 'Select All'}
          />
        </ListItemButton>
      </ListItem>
    </List>
  );
};
