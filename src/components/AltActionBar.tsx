import { BoxProps } from "@mui/material";
import { ActionRow, AltButton, PriButton } from "../control";


interface IAltActionBar extends BoxProps {
    primaryLabel: string;
    primaryOnClick: () => void;
    primaryDisabled?: boolean;
    primaryKey: string;
    primaryAria: string;
    altShown?: boolean;
    altLabel: string;
    altOnClick: () => void;
    altDisabled?: boolean;
    altKey: string;
    altAria: string;
}

export const AltActionBar = ({
  primaryLabel,
  primaryOnClick,
  primaryDisabled,
  primaryKey,
  primaryAria,
  altShown,
  altLabel,
  altOnClick,
  altDisabled,
  altKey,
  altAria,
  ...rest
}: IAltActionBar) => (
  <ActionRow sx={{ 
    textAlign: 'left', 
    padding: '0px', 
    backgroundColor: 'primary.contrastText', 
    zIndex: '100', 
    ...rest.sx 
  }}>
    <PriButton
      id="primaryAction"
      key={primaryKey}
      aria-label={primaryAria}
      disabled={primaryDisabled || false}
      sx={{ marginLeft: '0' }}
      onClick={primaryOnClick}
    >
      {primaryLabel}  
    </PriButton>
    { altShown && 
      (<AltButton
        id="altAction"
        key={altKey}
        aria-label={altAria}
        onClick={altOnClick}
        sx={{ marginLeft:'8px' }}
      >
        {altLabel}
      </AltButton>)
    }
  </ActionRow>
);