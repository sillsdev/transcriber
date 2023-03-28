import * as React from 'react';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import {
  Autocomplete,
  Checkbox,
  createFilterOptions,
  SxProps,
  TextField,
} from '@mui/material';
import { ITag } from '../model';
import { useSelector, shallowEqual } from 'react-redux';
import { vProjectSelector } from '../selector';

const sortedOpts = (tags: ITag) =>
  Object.keys(tags)
    .map((k) => k) // no empty keys
    .sort();

export const filteredOptions = (tags: ITag) =>
  sortedOpts(tags).filter((tag) => tags[tag]);

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

const filter = createFilterOptions<string>();

interface IProps {
  label?: string;
  tags: ITag;
  onChange?: (value: ITag) => void;
  sx?: SxProps;
}

export default function Tags({ label, tags, onChange, sx }: IProps) {
  const [value, setValue] = React.useState<string[]>([]);
  const [name, setName] = React.useState('');
  const cleared = React.useRef(false);
  const t = useSelector(vProjectSelector, shallowEqual);

  const options = React.useMemo(() => sortedOpts(tags), [tags]);

  React.useEffect(() => {
    setValue(filteredOptions(tags));
  }, [tags]);

  const updValue = (value: string) => ({
    ...tags,
    [value]: tags[value] !== undefined ? !tags[value] : true,
  });

  const handleChoice = (newValue: string | string[]) => {
    if (newValue && !Array.isArray(newValue)) {
      const value = updValue(newValue);
      setValue(filteredOptions(value));
      onChange && onChange(value);
    } else if (newValue) {
      setValue(newValue as string[]);
      if (newValue && !cleared.current) {
        const newTags = { ...tags };
        const keys = Array.from(new Set(Object.keys(newTags).concat(newValue)));
        const selected = new Set(newValue);
        keys.forEach((k) => {
          newTags[k] = selected.has(k);
        });
        onChange && onChange(newTags);
      } else {
        cleared.current = false;
      }
    }
    if (name) setName('');
  };

  const handleInputChange = (
    event: React.SyntheticEvent,
    value: string,
    reason: string
  ) => {
    if (reason === 'clear') {
      setValue([]);
      onChange && onChange({});
      cleared.current = true;
    } else if (reason === 'input') {
      if (value !== name) setName(value.trim());
    }
  };

  const handleEnter = (event: React.KeyboardEvent) => {
    if (event.code === 'Enter') {
      handleChoice(name);
    }
  };

  const handleLeave = (event: React.SyntheticEvent, reason: String) => {
    if (reason === 'blur' && name) {
      handleChoice(name);
    }
  };

  return (
    <Autocomplete
      multiple
      id="checkboxes-tags"
      options={options}
      value={value ?? []}
      disableCloseOnSelect
      onChange={(event, newValue) => handleChoice(newValue)}
      onInputChange={handleInputChange}
      onClose={handleLeave}
      filterOptions={(options, params) => {
        const filtered = filter(options, params);
        const { inputValue } = params;
        const isExisting = options.some((option) => inputValue === option);
        if (inputValue !== '' && !isExisting) {
          filtered.push(inputValue);
        }
        return filtered;
      }}
      selectOnFocus
      clearOnBlur
      handleHomeEndKeys
      renderOption={(props, option) => (
        <li {...props}>
          <Checkbox
            icon={icon}
            checkedIcon={checkedIcon}
            style={{ marginRight: 8 }}
            checked={tags[option] ?? false}
          />
          {option}
        </li>
      )}
      style={{ width: 500 }}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder={label ?? t.tags}
          onKeyUp={handleEnter}
        />
      )}
      noOptionsText={t.noOptions}
      sx={sx}
    />
  );
}
