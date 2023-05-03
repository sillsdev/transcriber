import { Stack, Typography } from '@mui/material';
import { PriButton } from '../control';

interface IErrorFallback {
  error: Error;
  info: React.ErrorInfo;
  clearError: () => void;
}

export const ErrorFallback = ({ error, info, clearError }: IErrorFallback) => {
  return (
    <Stack>
      <Typography>
        {error?.message ?? JSON.stringify(error, null, 2)}
      </Typography>
      <Typography>{info.componentStack}</Typography>
      <PriButton onClick={clearError}>Clear</PriButton>
    </Stack>
  );
};
