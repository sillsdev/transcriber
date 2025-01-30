import * as React from 'react';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import SettingsIcon from '@mui/icons-material/Settings';

export interface IConfButton {
  id?: string;
  disabled?: boolean;
  title?: string;
  onClick?: () => void;
  onSettings?: () => void;
}

export default function ConfButton({
  id,
  disabled,
  onClick,
  onSettings,
  title,
  children,
}: IConfButton & React.PropsWithChildren) {
  const anchorRef = React.useRef<HTMLDivElement>(null);

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const handleSettings = () => {
    if (onSettings) {
      onSettings();
    }
  };

  return (
    <React.Fragment>
      <ButtonGroup
        variant="contained"
        color="inherit"
        disabled={disabled}
        ref={anchorRef}
        aria-label="Button group with a nested menu"
      >
        <Button onClick={handleClick} id={id} title={title}>
          {children}
        </Button>
        <Button size="small" onClick={handleSettings}>
          <SettingsIcon
            fontSize="small"
            sx={{
              color: disabled ? 'grey[400]' : 'secondary.light',
              opacity: 0.7,
            }}
          />
        </Button>
      </ButtonGroup>
    </React.Fragment>
  );
}
