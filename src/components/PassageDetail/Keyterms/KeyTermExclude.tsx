import * as React from 'react';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import ListItemText from '@mui/material/ListItemText';
import Select, { SelectChangeEvent, SelectProps } from '@mui/material/Select';
import Checkbox from '@mui/material/Checkbox';
import HideIcon from '@mui/icons-material/VisibilityOff';
import ShowIcon from '@mui/icons-material/Visibility';
import SwapHoriz from '@mui/icons-material/SwapHoriz';
import { ktHide } from './useKeyTerms';
import { useSelector, shallowEqual } from 'react-redux';
import { IKeyTermsStrings } from '../../../model';
import { keyTermsSelector } from '../../../selector';
import { Box, styled } from '@mui/material';

const StyledSelect = styled(Select)<SelectProps>(() => ({
  '& #exclude-multiple': {
    paddingTop: '5px',
    paddingBottom: '5px',
  },
}));

export const KtExcludeTag = 'ktExcl';
export type TermId = string | number;
export type ExcludeArray = TermId[];

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
  cat: string[];
  onChange: (excl: string[]) => void;
  getLabel: (cat: string) => string;
}
export default function KeyTermExclude({
  init,
  cat,
  onChange,
  getLabel,
}: IProps) {
  const [names, setNames] = React.useState<string[]>([]);
  const [exclName, setExclName] = React.useState<string[]>([]);
  const t: IKeyTermsStrings = useSelector(keyTermsSelector, shallowEqual);

  React.useEffect(() => {
    setNames(cat.map((c) => getLabel(c)));
    setExclName(init.map((c) => getLabel(c)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [init]);

  const handleChange = (event: SelectChangeEvent<typeof exclName>) => {
    const {
      target: { value },
    } = event;
    // On autofill we get a stringified value.
    const newValue = typeof value === 'string' ? value.split(',') : value;
    setExclName(newValue);
    onChange(newValue.map((v) => cat[names.indexOf(v)]));
  };

  return (
    <div>
      <FormControl sx={{ m: 1, width: 300 }}>
        <InputLabel id="exclude-multiple-label" sx={{ top: '-10px' }}>
          {t.exclude}
        </InputLabel>
        <StyledSelect
          labelId="exclude-multiple-label"
          id="exclude-multiple"
          multiple
          value={exclName}
          onChange={handleChange as any}
          input={<OutlinedInput label={t.exclude} />}
          renderValue={(selected: unknown) => (selected as string[]).join(', ')}
          MenuProps={MenuProps}
        >
          {names.map((name) => (
            <MenuItem key={name} value={name}>
              <Checkbox checked={exclName.indexOf(name) > -1} />
              <ListItemText
                primary={
                  name !== getLabel(ktHide) ? (
                    name
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {name}
                      <ShowIcon
                        fontSize="small"
                        htmlColor="grey"
                        sx={{ pl: 2 }}
                      />
                      <SwapHoriz
                        fontSize="small"
                        htmlColor="grey"
                        sx={{ px: 1 }}
                      />
                      <HideIcon fontSize="small" htmlColor="grey" />
                    </Box>
                  )
                }
              />
            </MenuItem>
          ))}
        </StyledSelect>
      </FormControl>
    </div>
  );
}
