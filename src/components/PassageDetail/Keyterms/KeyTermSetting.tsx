import * as React from 'react';
import { useGlobal } from 'reactn';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import SettingsIcon from '@mui/icons-material/Settings';
import { IconButton, Tooltip } from '@mui/material';
import { localeLanguages } from './useKeyTerms';
import { langName } from '../../../utils';
import { shallowEqual, useSelector } from 'react-redux';
import { keyTermsSelector } from '../../../selector';
import { IKeyTermsStrings } from '../../../model';

interface IProps {
  curCode: string;
  onChange?: (code: string) => void;
}

export default function KeyTermSetting({ curCode, onChange }: IProps) {
  const [locale] = useGlobal('lang');
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const t: IKeyTermsStrings = useSelector(keyTermsSelector, shallowEqual);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleChange = (code: string) => () => {
    setAnchorEl(null);
    onChange && onChange(code);
  };

  return (
    <div>
      <Tooltip title={t.settingLanguage}>
        <IconButton
          id="settings-icon"
          aria-controls={open ? 'settings-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
          onClick={handleClick}
        >
          <SettingsIcon />
        </IconButton>
      </Tooltip>
      <Menu
        id="settings-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'basic-button',
        }}
      >
        {localeLanguages.map((option: string, idx: number) => (
          <MenuItem
            key={'loc' + idx}
            value={option}
            onClick={handleChange(option)}
            sx={{ backgroundColor: option === curCode ? 'lightgrey' : 'white' }}
          >
            {langName(locale, option.split('-')[0].toLowerCase()) +
              ` [${option}]`}
          </MenuItem>
        ))}
      </Menu>
    </div>
  );
}
