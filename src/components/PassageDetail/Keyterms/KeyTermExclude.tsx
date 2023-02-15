import * as React from 'react';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import ListItemText from '@mui/material/ListItemText';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import Checkbox from '@mui/material/Checkbox';
import { useKeyTerms } from '../../../utils';
import { useSelector, shallowEqual } from 'react-redux';
import { IKeyTermsStrings } from '../../../model';
import { keyTermsSelector } from '../../../selector';

export const KtExcludeTag = 'ktExcl';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};
interface IProps {
  init: string[];
  onChange: (excl: string[]) => void;
}
export default function KeyTermExclude({ init, onChange }: IProps) {
  const { ktCat, catLabel } = useKeyTerms();
  const [names, setNames] = React.useState<string[]>([]);
  const [exclName, setExclName] = React.useState<string[]>([]);
  const t: IKeyTermsStrings = useSelector(keyTermsSelector, shallowEqual);

  React.useEffect(() => {
    setNames(ktCat.map((c) => catLabel(c)));
    setExclName(init.map((c) => catLabel(c)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [init]);

  const handleChange = (event: SelectChangeEvent<typeof exclName>) => {
    const {
      target: { value },
    } = event;
    // On autofill we get a stringified value.
    const newValue = typeof value === 'string' ? value.split(',') : value;
    setExclName(newValue);
    onChange(newValue.map((v) => ktCat[names.indexOf(v)]));
  };

  return (
    <div>
      <FormControl sx={{ m: 1, width: 300 }}>
        <InputLabel id="demo-multiple-checkbox-label">{t.exclude}</InputLabel>
        <Select
          labelId="demo-multiple-checkbox-label"
          id="demo-multiple-checkbox"
          multiple
          value={exclName}
          onChange={handleChange}
          input={<OutlinedInput label={t.exclude} />}
          renderValue={(selected) => selected.join(', ')}
          MenuProps={MenuProps}
        >
          {names.map((name) => (
            <MenuItem key={name} value={name}>
              <Checkbox checked={exclName.indexOf(name) > -1} />
              <ListItemText primary={name} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </div>
  );
}
