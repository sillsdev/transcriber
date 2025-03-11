import { DialogTitle, DialogTitleProps, IconButton, styled } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface IStyledDialogTitleProps extends DialogTitleProps {
  onClose?: () => void;
}

const DialogTitleWithStyles = styled(DialogTitle)<IStyledDialogTitleProps>
(() => ({
  display: 'flex', 
  justifyContent: 'space-between', 
  alignItems: 'center',
  padding: '10px',
  paddingLeft: '25px',
  color: 'secondary.contrastText',
  borderBottom: '1px solid lightgray',
}));

export const StyledDialogTitle = ({children, ...rest}: IStyledDialogTitleProps) => (
  <DialogTitleWithStyles
    {...rest}
  >
    {children}
    {rest.onClose && 
      <IconButton
        aria-label="close"
        onClick={rest.onClose}
        sx={{ color: 'secondary.contrastText' }}>
        <CloseIcon></CloseIcon>
      </IconButton>
    }
  </DialogTitleWithStyles>
);