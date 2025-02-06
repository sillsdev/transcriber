import { Stack, Typography } from '@mui/material';
import { PriButton } from '../control';
import { IMainStrings } from '../model';
import { shallowEqual, useSelector } from 'react-redux';
import { mainSelector } from '../selector';

interface IErrorFallback {
  error: Error;
  info: React.ErrorInfo;
  clearError: () => void;
}

export const ErrorFallback = ({ error, info, clearError }: IErrorFallback) => {
  const t: IMainStrings = useSelector(mainSelector, shallowEqual);
  return (
    <Stack>
      <Typography>
        {error?.message ?? JSON.stringify(error, null, 2)}
      </Typography>
      <Typography>{info.componentStack}</Typography>
      <PriButton onClick={clearError}>{t.clear}</PriButton>
    </Stack>
  );
};
